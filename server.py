from fastapi import FastAPI, Request, Response, Cookie, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
import Database.functions_db as db
import jwt
from typing import Optional
from datetime import datetime, timedelta

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambia esto a tus dominios específicos
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
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Función para verificar token JWT con mejor manejo de errores
def verify_token(token: Optional[str] = Cookie(None)):
    if not token:
        # No mostrar error cuando no hay token
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except (jwt.JWTError, Exception) as e:
        if not isinstance(e, jwt.JWTError):
            # Solo mostrar errores no esperados
            print(f"Error inesperado al verificar token: {str(e)}")
        return None


# Middleware para verificar si el usuario está autenticado
async def get_current_user(user_data: Optional[dict] = Depends(verify_token)):
    return user_data


# Raiz del proyecto
@app.get("/")
def read_root(user_data: Optional[dict] = Depends(verify_token)):
    return FileResponse("templates/index.html")


# Ruta de formulario de registro
@app.get("/register")
def read_root():
    return FileResponse("templates/RegisterUser.html")


# Manejo del registro del usuario
@app.post("/register")
async def register_user(request: Request):
    user_data = await request.json()

    # Verificar si el usuario ya existe
    if db.usuario_existe(user_data["email"]):
        return JSONResponse(status_code=400, content={"message": "Usuario ya existente"})
    else:
        # Usar el mismo password como confirmación si no se proporciona confirmPassword
        confirm_password = user_data.get("confirmPassword", user_data["password"])

        usuario = db.guardar_usuario(
            user_data["name"],
            user_data["lastName"],
            user_data["secondLastName"],
            user_data["email"],
            user_data["password"],
            confirm_password  # Pasamos la variable que puede ser el mismo password
        )
        return JSONResponse(status_code=200, content={"message": "Usuario registrado correctamente"})


# Ruta de formulario de login
@app.get("/login")
def read_root():
    return FileResponse("templates/Login.html")


# Manejo del acceso a la cuenta de usuario
@app.post("/login")
async def login_user(request: Request, response: Response):
    user_data = await request.json()

    if db.usuario_existe(user_data["email"]):
        if db.verificar_contrasena(user_data["email"], user_data["password"]):
            # Obtener datos del usuario
            usuario = db.obtener_usuario_por_email(user_data["email"])

            # Crear token JWT
            token_data = {
                "id": usuario["id"],
                "email": usuario["correo"],
                "nombre": usuario["nombre"]
            }
            access_token = create_access_token(token_data)

            # Establecer cookie con el token (asegúrate de usar secure=True en producción con HTTPS)
            response.set_cookie(
                key="token",
                value=access_token,
                httponly=True,
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                samesite="lax",
                path="/"  # Importante: asegura que la cookie está disponible en todo el sitio
            )

            return JSONResponse(
                status_code=200,
                content={"message": "Usuario autenticado correctamente", "usuario": usuario["nombre"]}
            )
        else:
            return JSONResponse(status_code=400, content={"message": "Contraseña incorrecta"})
    else:
        return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})


# Ruta para cerrar sesión
@app.get("/logout")
def logout(response: Response):
    response.delete_cookie(key="token")
    return RedirectResponse(url="/")


@app.get("/propiedades")
def read_propiedades(user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        # Mostrar vista limitada para usuarios no autenticados
        return FileResponse("templates/propitiates.html")
    # Mostrar vista completa para usuarios autenticados
    return FileResponse("templates/propitiates.html")


@app.get("/api/propiedades")
async def get_propiedades():
    propiedades = db.obtener_propiedades()
    return JSONResponse(status_code=200, content={"propiedades": propiedades})


@app.get("/api/mis-propiedades")
async def get_mis_propiedades(user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    propiedades = db.obtener_propiedades_por_usuario(user_data["id"])
    return JSONResponse(status_code=200, content={"propiedades": propiedades})


@app.get("/dashboard_user")
def read_root(user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        return RedirectResponse(url="/login")
    return FileResponse("templates/dashboard_user.html")


@app.post("/api/propiedades")
async def registrar_propiedad(request: Request, user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    propiedad_data = await request.json()

    try:
        id_propiedad = db.registrar_propiedad(
            propiedad_data["nombre"],
            propiedad_data["direccion"],
            propiedad_data["descripcion"],
            propiedad_data["precio"],
            propiedad_data["imagen"],
            propiedad_data["disponible"],
            user_data["id"]  # Usar el ID del usuario autenticado
        )
        return JSONResponse(status_code=200,
                            content={"message": "Propiedad registrada correctamente", "id": id_propiedad})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al registrar la propiedad: {str(e)}"})


@app.delete("/api/propiedades/{propiedad_id}")
async def eliminar_propiedad(propiedad_id: int, user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    try:
        # Verificar si la propiedad pertenece al usuario
        if not db.verificar_propiedad_usuario(propiedad_id, user_data["id"]):
            return JSONResponse(status_code=403, content={"message": "No tienes permiso para eliminar esta propiedad"})

        db.eliminar_propiedad(propiedad_id)
        return JSONResponse(status_code=200, content={"message": "Propiedad eliminada correctamente"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al eliminar la propiedad: {str(e)}"})


@app.get("/api/usuario")
async def get_usuario_actual(user_data: Optional[dict] = Depends(verify_token)):
    if not user_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    try:
        usuario = db.obtener_usuario_por_id(user_data["id"])
        return JSONResponse(status_code=200, content={"usuario": usuario})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error al obtener datos del usuario: {str(e)}"})