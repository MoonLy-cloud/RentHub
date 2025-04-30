from fastapi import APIRouter, Request, Body, Depends
from fastapi.responses import JSONResponse, RedirectResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import create_access_token, verify_token_header
from utils.logger import logger

router = APIRouter(tags=["Autenticación"])

@router.get("/register")
async def register_page():
    """Redirige a la página principal donde están los modales"""
    return RedirectResponse(url="/")

@router.post("/register")
async def register_user(data: dict = Body(...)):
    """Registra un nuevo usuario en el sistema"""
    try:
        # Extraer datos del usuario
        nombre = data.get("name")
        apellido_p = data.get("lastName")
        apellido_m = data.get("secondLastName")
        correo = data.get("email")
        contrasena = data.get("password")
        contrasena_confirmacion = data.get("confirmPassword")
        curp = data.get("curp")

        # Validar campos obligatorios
        if not all([nombre, apellido_p, correo, contrasena, contrasena_confirmacion, curp]):
            return JSONResponse(
                status_code=400,
                content={"message": "Todos los campos obligatorios deben estar completos"}
            )

        # Validar si existe
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

        logger.info(f"Usuario registrado: {correo}")
        return {"success": True, "message": "Usuario registrado correctamente", "usuario_id": usuario.id_usuario}
    except Exception as e:
        logger.error(f"Error en registro: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al registrar usuario: {str(e)}"}
        )

@router.get("/login")
def login_page():
    """Página de inicio de sesión"""
    return RedirectResponse(url="/")

@router.post("/login")
async def login_user(request: Request):
    """Autentica a un usuario y devuelve un token JWT"""
    try:
        # Obtener datos del usuario
        user_data = await request.json()

        # Verificar si existe
        if not db.usuario_existe(user_data.get("email", "")):
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

        # Verificar contraseña
        if not db.verificar_contrasena(user_data["email"], user_data["password"]):
            return JSONResponse(status_code=400, content={"message": "Contraseña incorrecta"})

        # Obtener datos del usuario
        usuario = db.obtener_usuario_por_email(user_data["email"])

        # Generar token
        token_data = {
            "id": usuario["id"],
            "email": usuario["correo"],
            "nombre": usuario["nombre"]
        }
        access_token = create_access_token(token_data)

        # Log de acceso exitoso
        logger.info(f"Login exitoso: {usuario['correo']}")

        # Devolver respuesta
        return JSONResponse(
            status_code=200,
            content={
                "message": "Usuario autenticado correctamente",
                "usuario": usuario,
                "token": access_token
            }
        )
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error en el proceso de login: {str(e)}"})

@router.get("/logout")
def logout():
    """Cierra la sesión del usuario"""
    return JSONResponse(status_code=200, content={"message": "Sesión cerrada correctamente"})

@router.delete("/api/eliminar-cuenta")
async def eliminar_cuenta(request: Request):
    """Elimina la cuenta del usuario autenticado"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado", "success": False})
        
    try:
        data = await request.json()
        password = data.get("password")
        
        # Verificar contraseña
        if not db.verificar_contrasena_por_id(token_data["id"], password):
            return JSONResponse(
                status_code=400,
                content={"message": "Contraseña incorrecta", "success": False}
            )
            
        # Eliminar cuenta
        if db.eliminar_usuario(token_data["id"]):
            logger.info(f"Cuenta eliminada: ID {token_data['id']}")
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
        logger.error(f"Error al eliminar cuenta: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error: {str(e)}", "success": False}
        )
