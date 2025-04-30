from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import verify_token_header
from utils.logger import logger

router = APIRouter(tags=["Administración"])

# En producción, deberías implementar una verificación de rol de administrador
def verificar_admin(token_data: dict):
    """
    Verifica si un usuario es administrador.
    
    En una implementación real, verificaría el rol del usuario.
    Actualmente solo valida que el token exista.
    """
    return token_data is not None

@router.get("/admin/usuarios")
async def admin_usuarios(token_data: dict = Depends(verify_token_header)):
    """Obtiene todos los usuarios registrados (solo admin)"""
    # Esto debe mejorarse con verificación de roles
    # if not verificar_admin(token_data):
    #     return JSONResponse(status_code=403, content={"message": "Acceso restringido a administradores"})
        
    try:
        usuarios = db.obtener_todos_usuarios()
        return {"usuarios": usuarios}
    except Exception as e:
        logger.error(f"Error al obtener usuarios para admin: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error al obtener usuarios: {str(e)}"}
        )

@router.delete("/api/admin/eliminar-usuario/{usuario_id}")
async def admin_eliminar_usuario(
    usuario_id: int, 
    token_data: dict = Depends(verify_token_header)
):
    """Elimina un usuario por su ID (solo admin)"""
    # Esto debe mejorarse con verificación de roles
    # if not verificar_admin(token_data):
    #     return JSONResponse(status_code=403, content={"message": "Acceso restringido a administradores"})
        
    try:
        if db.eliminar_usuario(usuario_id):
            logger.info(f"Usuario eliminado por admin: {usuario_id}")
            return JSONResponse(status_code=200, content={"message": "Usuario eliminado correctamente"})
        else:
            return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})
    except Exception as e:
        logger.error(f"Error al eliminar usuario (admin): {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error al eliminar usuario: {str(e)}"})
