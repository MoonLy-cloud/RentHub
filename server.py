import jsonify
from fastapi import FastAPI, Request, Response, Cookie, Depends, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
import Database.functions_db as db
import jwt
from datetime import datetime, timedelta
from fastapi import UploadFile, File, Form
import shutil
import os
import uuid

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("Iniciando la aplicación...")
    db.inicializar_base_datos()

    # Crear directorio para subida de imágenes
    upload_dir = "static/uploads/profile"
    os.makedirs(upload_dir, exist_ok=True)
    # Asegurar permisos de escritura
    try:
        os.chmod(upload_dir, 0o755)
    except Exception as e:
        print(f"Advertencia: No se pudieron establecer permisos: {e}")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/static/components", StaticFiles(directory="static/components"), name="components")
templates = Jinja2Templates(directory="templates")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],  # Explícitamente tus orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clave secreta para JWT
SECRET_KEY = "tu_clave_secreta_muy_segura"  # En producción, usar una clave segura
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 semana


# Función para crear token JWT
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    print(f"Creando token con datos: {to_encode}")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Raiz del proyecto
@app.get("/")
def read_root():
    return FileResponse("templates/index.html")


# Ruta de formulario de registro
@app.get("/register")
async def register_page():
    # Redirigir a la página principal donde están los modales
    return RedirectResponse(url="/")


# Manejo del registro del usuario
@app.post("/register")
async def register_user(data: dict = Body(...)):
    try:
        nombre = data.get("name")
        apellido_p = data.get("lastName")
        apellido_m = data.get("secondLastName")
        correo = data.get("email")
        contrasena = data.get("password")
        contrasena_confirmacion = data.get("confirmPassword")
        curp = data.get("curp")

        # Validar si el usuario ya existe
        if db.usuario_existe(correo=correo, curp=curp):
            return JSONResponse(
                status_code=400,
                content={"message": "El correo o CURP ya están registrados"}
            )

        # Guardar nuevo usuario
        usuario = db.guardar_usuario(
            nombre=nombre,
            apellido_p=apellido_p,
            apellido_m=apellido_m,
            correo=correo,
            contrasena=contrasena,
            contrasena_confirmacion=contrasena_confirmacion,
            curp=curp
        )

        return {"success": True, "message": "Usuario registrado correctamente", "usuario_id": usuario.id_usuario}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al registrar usuario: {str(e)}"}
        )


@app.get("/publicar")
def read_root():
    return FileResponse("templates/publicar.html")

# Ruta de formulario de login
@app.get("/login")
def read_root():
    return FileResponse("templates/login.html")


# Manejo del acceso a la cuenta de usuario
@app.post("/login")
async def login_user(request: Request, response: Response):
    try:
        user_data = await request.json()

        if not db.usuario_existe(user_data["email"]):
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

        if not db.verificar_contrasena(user_data["email"], user_data["password"]):
            return JSONResponse(status_code=400, content={"message": "Contraseña incorrecta"})

        usuario = db.obtener_usuario_por_email(user_data["email"])

        # Generar token pero no usarlo para cookies
        token_data = {
            "id": usuario["id"],
            "email": usuario["correo"],
            "nombre": usuario["nombre"]
        }
        access_token = create_access_token(token_data)

        # Devolver los datos completos del usuario
        return JSONResponse(
            status_code=200,
            content={
                "message": "Usuario autenticado correctamente",
                "usuario": usuario,
                "token": access_token  # Enviamos el token al cliente
            }
        )
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error en el proceso de login: {str(e)}"})


# En el endpoint /logout
@app.get("/logout")
def logout():
    # Ya no necesitamos eliminar cookies
    return JSONResponse(status_code=200, content={"message": "Sesión cerrada correctamente"})


# Cambia la dependencia de verificación de token
def verify_token_header(request: Request):
    token = None
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

            # Opcionalmente: verificar si el usuario sigue existiendo en la base de datos
            usuario = db.obtener_usuario_por_id(payload["id"])
            if not usuario:
                return None

            return payload
        except jwt.ExpiredSignatureError:
            return None
        except Exception as e:
            print(f"Error al verificar token: {str(e)}")
            return None
    return None


# Modifica las rutas protegidas
@app.get("/api/mis-propiedades")
async def get_mis_propiedades(request: Request):
    # Extraer token del encabezado Authorization
    token = None
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        propiedades = db.obtener_propiedades_por_usuario(payload["id"])
        return JSONResponse(status_code=200, content={"propiedades": propiedades})
    except Exception as e:
        return JSONResponse(status_code=401, content={"message": f"No autorizado: {str(e)}"})


@app.get("/propiedades")
def read_propiedades():
    return FileResponse("templates/propitiates.html")


@app.get("/api/propiedades")
async def get_propiedades():
    propiedades = db.obtener_propiedades()
    return JSONResponse(status_code=200, content={"propiedades": propiedades})

@app.post("/api/propiedades")
async def registrar_propiedad(request: Request):
    try:
        data = await request.json()

        # Extraer token del encabezado Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"message": "No autorizado"})

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            usuario_id = payload["id"]
        except Exception:
            return JSONResponse(status_code=401, content={"message": "Token inválido"})

        # Resto de la lógica...
        propiedad_data = data.get("propiedad")

        id_propiedad = db.registrar_propiedad(
            propiedad_data["nombre"],
            propiedad_data.get("direccion", ""),
            propiedad_data["descripcion"],
            propiedad_data["precio"],
            propiedad_data["imagen"],
            propiedad_data["disponible"],
            usuario_id
        )
        return JSONResponse(status_code=200,
                            content={"message": "Propiedad registrada correctamente", "id": id_propiedad})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al registrar la propiedad: {str(e)}"})


@app.get("/api/propiedades/{propiedad_id}")
async def get_propiedad(propiedad_id: int):
    # Sin verificación de autorización
    propiedad = db.obtener_propiedad_por_id(propiedad_id)

    if not propiedad:
        return JSONResponse(status_code=404, content={"message": "Propiedad no encontrada"})

    return JSONResponse(status_code=200, content={"propiedad": propiedad})

@app.get("/api/propiedades/publico/{propiedad_id}")
async def get_propiedad_publico(propiedad_id: int):
    propiedad = db.obtener_propiedad_por_id(propiedad_id)

    if not propiedad:
        return JSONResponse(status_code=404, content={"message": "Propiedad no encontrada"})

    return JSONResponse(status_code=200, content={"propiedad": propiedad})


@app.put("/api/propiedades/{propiedad_id}")
async def actualizar_propiedad(propiedad_id: int, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        data = await request.json()

        # Verificar que la propiedad pertenece al usuario actual
        if not db.verificar_propiedad_usuario(propiedad_id, payload["id"]):
            return JSONResponse(status_code=403, content={"message": "No tienes permiso para modificar esta propiedad"})

        propiedad_data = data.get("propiedad")

        db.actualizar_propiedad(
            propiedad_id,
            propiedad_data["nombre"],
            propiedad_data["direccion"],
            propiedad_data["descripcion"],
            propiedad_data["precio"],
            propiedad_data["imagen"],
            propiedad_data["disponible"]
        )

        return JSONResponse(status_code=200, content={"message": "Propiedad actualizada correctamente"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@app.delete("/api/propiedades/{propiedad_id}")
async def eliminar_propiedad(propiedad_id: int, request: Request):
    # Obtener token del header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Resto del código igual
        if not db.verificar_propiedad_usuario(propiedad_id, payload["id"]):
            return JSONResponse(status_code=403, content={"message": "No tienes permiso para eliminar esta propiedad"})

        db.eliminar_propiedad(propiedad_id)
        return JSONResponse(status_code=200, content={"message": "Propiedad eliminada correctamente"})
    except Exception as e:
        return JSONResponse(status_code=401, content={"message": f"No autorizado: {str(e)}"})


@app.get("/api/usuario")
async def get_usuario(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario = db.obtener_usuario_por_id(payload["id"])

        if not usuario:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

        return JSONResponse(status_code=200, content={"usuario": usuario})
    except Exception as e:
        return JSONResponse(status_code=401, content={"message": f"No autorizado: {str(e)}"})


@app.get("/api/usuario/{usuario_id}")
async def get_usuario_by_id(usuario_id: int):
    usuario = db.obtener_usuario_por_id(usuario_id)

    if not usuario:
        return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

    # Solo devolver información pública
    return JSONResponse(status_code=200, content={
        "usuario": {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "correo": usuario["correo"]
        }
    })

@app.get("/mi-perfil")
def mi_perfil_page():
    return FileResponse("templates/perfil.html")


@app.get("/api/mi-perfil")
async def get_mi_perfil(request: Request):
    # Extraer token del encabezado Authorization
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario = db.obtener_usuario_por_id(payload["id"])

        if not usuario:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

        return JSONResponse(status_code=200, content={"perfil": usuario})
    except Exception as e:
        return JSONResponse(status_code=401, content={"message": f"No autorizado: {str(e)}"})


@app.put("/api/actualizar-perfil")
async def actualizar_perfil(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload["id"]

        # Obtener datos de la solicitud
        data = await request.json()

        # Verificar si se está actualizando la contraseña
        if "passwordActual" in data and "passwordNuevo" in data:
            if not db.verificar_contrasena_por_id(usuario_id, data["passwordActual"]):
                return JSONResponse(status_code=400, content={"message": "Contraseña actual incorrecta"})

            # Actualizar contraseña
            db.actualizar_contrasena(usuario_id, data["passwordNuevo"])

        # Actualizar datos del perfil
        db.actualizar_usuario(
            usuario_id,
            data["nombre"],
            data["apellido1"],
            data["apellido2"],
            data["correo"]
        )

        return JSONResponse(status_code=200, content={"message": "Perfil actualizado correctamente"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al actualizar perfil: {str(e)}"})


@app.delete("/api/eliminar-cuenta")
async def eliminar_cuenta(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado", "success": False})

    token = auth_header.split(" ")[1]

    try:
        # Decodificar el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload["id"]

        # Obtener datos de la solicitud
        data = await request.json()
        password = data.get("password")

        # Verificar contraseña
        if not db.verificar_contrasena_por_id(usuario_id, password):
            return JSONResponse(
                status_code=400,
                content={"message": "Contraseña incorrecta", "success": False}
            )

        # Eliminar la cuenta y sus datos asociados
        if db.eliminar_usuario(usuario_id):
            return JSONResponse(
                status_code=200,
                content={"message": "Cuenta eliminada correctamente", "success": True}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Error al eliminar la cuenta", "success": False}
            )

    except Exception as e:
        print(f"Error al eliminar cuenta: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error: {str(e)}", "success": False}
        )


@app.post("/api/conectar-paypal")
async def conectar_paypal(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload["id"]

        data = await request.json()
        paypal_email = data.get("paypal_email")

        if not paypal_email:
            return JSONResponse(status_code=400, content={"message": "Email de PayPal no proporcionado"})

        # Actualizar el email de PayPal en la base de datos
        db.actualizar_paypal(usuario_id, paypal_email)

        return JSONResponse(status_code=200, content={"message": "PayPal conectado correctamente"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al conectar PayPal: {str(e)}"})


@app.delete("/api/desconectar-paypal")
async def desconectar_paypal(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload["id"]

        # Eliminar el email de PayPal en la base de datos
        db.actualizar_paypal(usuario_id, None)

        return JSONResponse(status_code=200, content={"message": "PayPal desconectado correctamente"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al desconectar PayPal: {str(e)}"})


# Añadir este endpoint
@app.post("/api/actualizar-imagen")
async def actualizar_imagen(
        file: UploadFile = File(...),
        token_data: dict = Depends(verify_token_header)
):
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    usuario_id = token_data["id"]

    # Validar tipo de archivo
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    if file_extension not in allowed_extensions:
        return JSONResponse(
            status_code=400,
            content={"message": "Formato de archivo no permitido"}
        )

    # Crear carpeta de uploads si no existe
    upload_dir = "static/uploads/profile"
    os.makedirs(upload_dir, exist_ok=True)

    # Generar nombre único para el archivo
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"{upload_dir}/{unique_filename}"

    # Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Actualizar en base de datos
    db_path = f"/static/uploads/profile/{unique_filename}"
    try:
        db.actualizar_imagen_perfil(usuario_id, db_path)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Imagen actualizada correctamente",
                "imagen_path": db_path
            }
        )
    except Exception as e:
        # Si hay error, eliminar el archivo subido
        if os.path.exists(file_path):
            os.remove(file_path)
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al actualizar imagen: {str(e)}"}
        )
    finally:
        file.file.close()
        # NO eliminar el archivo aquí

@app.get("/api/mapbox-token")
async def get_mapbox_token():
    # Almacena el token como variable de entorno o en una constante en el servidor
    token = os.environ.get("MAPBOX_TOKEN", "pk.eyJ1IjoibW9vbmx5MTIiLCJhIjoiY204bjNreGduMG1weTJtcHE5OGdtejJvNCJ9.pdpFMcxEu9w0np44GEEu4g")
    return JSONResponse(status_code=200, content={"token": token})


@app.get("/admin")
def admin_page():
    return FileResponse("templates/admin.html")


@app.get("/admin/usuarios")
async def admin_usuarios():
    try:
        usuarios = db.obtener_todos_usuarios()
        return {"usuarios": usuarios}
    except Exception as e:
        print(f"Error al obtener usuarios: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al obtener usuarios: {str(e)}"}
        )

@app.delete("/api/admin/eliminar-usuario/{usuario_id}")
async def admin_eliminar_usuario(usuario_id: int):
    try:
        # Por ahora, permitimos la eliminación sin verificar token para pruebas
        if db.eliminar_usuario(usuario_id):
            return JSONResponse(status_code=200, content={"message": "Usuario eliminado correctamente"})
        else:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al eliminar usuario: {str(e)}"})