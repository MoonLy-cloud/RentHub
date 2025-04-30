from fastapi import APIRouter, Request, Depends, UploadFile, File
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import verify_token_header
from utils.file_handler import validate_image, save_uploaded_file
from utils.logger import logger

router = APIRouter(tags=["Usuarios"])

@router.get("/api/usuario")
async def get_usuario(request: Request):
    """Obtiene información del usuario autenticado"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        usuario = db.obtener_usuario_por_id(token_data["id"])
        if not usuario:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})
        return JSONResponse(status_code=200, content={"usuario": usuario})
    except Exception as e:
        logger.error(f"Error al obtener usuario {token_data['id']}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/usuario/{usuario_id}")
async def get_usuario_by_id(usuario_id: int):
    """Obtiene información pública de un usuario específico"""
    try:
        usuario = db.obtener_usuario_por_id(usuario_id)
        if not usuario:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})

        # Solo retornar información pública
        return JSONResponse(status_code=200, content={
            "usuario": {
                "id": usuario["id"],
                "nombre": usuario["nombre"],
                "correo": usuario["correo"],
                "imagen_perfil": usuario.get("imagen_perfil", "/static/imgs/user.gif")
            }
        })
    except Exception as e:
        logger.error(f"Error al obtener usuario {usuario_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/mi-perfil")
async def get_mi_perfil(request: Request):
    """Obtiene el perfil completo del usuario autenticado"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        usuario = db.obtener_usuario_por_id(token_data["id"])
        if not usuario:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})
        return JSONResponse(status_code=200, content={"perfil": usuario})
    except Exception as e:
        logger.error(f"Error al obtener perfil de usuario {token_data['id']}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.put("/api/actualizar-perfil")
async def actualizar_perfil(request: Request):
    """Actualiza la información del perfil del usuario"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        data = await request.json()
        usuario_id = token_data["id"]
        
        # Verificar si actualiza contraseña
        if "passwordActual" in data and "passwordNuevo" in data:
            if not db.verificar_contrasena_por_id(usuario_id, data["passwordActual"]):
                return JSONResponse(status_code=400, content={"message": "Contraseña actual incorrecta"})
            db.actualizar_contrasena(usuario_id, data["passwordNuevo"])
            
        # Actualizar datos generales
        db.actualizar_usuario(
            usuario_id,
            data["nombre"],
            data["apellido1"],
            data["apellido2"],
            data["correo"]
        )
        
        logger.info(f"Perfil actualizado: usuario {usuario_id}")
        return JSONResponse(status_code=200, content={"message": "Perfil actualizado correctamente"})
    except Exception as e:
        logger.error(f"Error al actualizar perfil de usuario {token_data['id']}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.post("/api/actualizar-imagen")
async def actualizar_imagen(
        file: UploadFile = File(...),
        token_data: dict = Depends(verify_token_header)
):
    """Actualiza la imagen de perfil del usuario"""
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})

    # Validación del archivo
    if not validate_image(file):
        return JSONResponse(
            status_code=400,
            content={"message": "Formato de archivo no permitido"}
        )
    
    try:
        # Guardar archivo
        success, db_path, fs_path = save_uploaded_file(file)
        
        if not success:
            return JSONResponse(
                status_code=500,
                content={"message": "Error al guardar la imagen"}
            )
        
        # Actualizar en BD
        db.actualizar_imagen_perfil(token_data["id"], db_path)
        
        logger.info(f"Imagen de perfil actualizada: usuario {token_data['id']}")
        return JSONResponse(
            status_code=200,
            content={
                "message": "Imagen actualizada correctamente",
                "imagen_path": db_path
            }
        )
    except Exception as e:
        logger.error(f"Error al actualizar imagen de perfil: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al actualizar imagen: {str(e)}"}
        )
