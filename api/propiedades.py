from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import verify_token_header
from utils.logger import logger

router = APIRouter(tags=["Propiedades"])

@router.get("/api/propiedades")
async def obtener_propiedades(search: str = None):
    """Obtiene todas las propiedades con filtro opcional"""
    try:
        propiedades = db.obtener_propiedades()

        # Aplicar filtro de búsqueda si se proporciona
        if search:
            search = search.lower()
            propiedades = [
                p for p in propiedades
                if (p.get('nombre') and search in p['nombre'].lower()) or
                (p.get('direccion') and search in p['direccion'].lower()) or
                (p.get('descripcion') and search in p['descripcion'].lower())
            ]

        return JSONResponse(status_code=200, content={"propiedades": propiedades})
    except Exception as e:
        logger.error(f"Error al obtener propiedades: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/propiedades/{propiedad_id}")
async def get_propiedad(propiedad_id: int):
    """Obtiene una propiedad específica por su ID"""
    try:
        propiedad = db.obtener_propiedad_por_id(propiedad_id)
        if not propiedad:
            return JSONResponse(status_code=404, content={"message": "Propiedad no encontrada"})
        return JSONResponse(status_code=200, content={"propiedad": propiedad})
    except Exception as e:
        logger.error(f"Error al obtener propiedad {propiedad_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/propiedades/publico/{propiedad_id}")
async def get_propiedad_publico(propiedad_id: int):
    """Alias público para obtener propiedad por ID"""
    return await get_propiedad(propiedad_id)

@router.post("/api/propiedades")
async def registrar_propiedad(request: Request):
    """Registra una nueva propiedad"""
    try:
        # Verificar token
        token_data = verify_token_header(request)
        if not token_data:
            return JSONResponse(status_code=401, content={"message": "No autorizado"})

        # Obtener datos
        data = await request.json()
        propiedad_data = data.get("propiedad")
        
        # Validación básica
        if not all([
            propiedad_data.get("nombre"), 
            propiedad_data.get("descripcion"),
            propiedad_data.get("precio")
        ]):
            return JSONResponse(
                status_code=400, 
                content={"message": "Faltan campos obligatorios"}
            )
        
        # Registrar propiedad
        id_propiedad = db.registrar_propiedad(
            propiedad_data["nombre"],
            propiedad_data.get("direccion", ""),
            propiedad_data["descripcion"],
            propiedad_data["precio"],
            propiedad_data["imagen"],
            propiedad_data["disponible"],
            token_data["id"]
        )
        
        logger.info(f"Propiedad registrada: {id_propiedad} por usuario {token_data['id']}")
        return JSONResponse(
            status_code=200,
            content={"message": "Propiedad registrada correctamente", "id": id_propiedad}
        )
    except Exception as e:
        logger.error(f"Error al registrar propiedad: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.put("/api/propiedades/{propiedad_id}")
async def actualizar_propiedad(propiedad_id: int, request: Request):
    """Actualiza una propiedad existente"""
    try:
        # Verificar token
        token_data = verify_token_header(request)
        if not token_data:
            return JSONResponse(status_code=401, content={"message": "No autorizado"})
            
        # Verificar propiedad
        if not db.verificar_propiedad_usuario(propiedad_id, token_data["id"]):
            return JSONResponse(
                status_code=403, 
                content={"message": "No tienes permiso para modificar esta propiedad"}
            )
        
        # Obtener datos
        data = await request.json()
        propiedad_data = data.get("propiedad")
        
        # Actualizar propiedad
        db.actualizar_propiedad(
            propiedad_id,
            propiedad_data["nombre"],
            propiedad_data["direccion"],
            propiedad_data["descripcion"],
            propiedad_data["precio"],
            propiedad_data["imagen"],
            propiedad_data["disponible"]
        )
        
        logger.info(f"Propiedad actualizada: {propiedad_id} por usuario {token_data['id']}")
        return JSONResponse(status_code=200, content={"message": "Propiedad actualizada correctamente"})
    except Exception as e:
        logger.error(f"Error al actualizar propiedad {propiedad_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.delete("/api/propiedades/{propiedad_id}")
async def eliminar_propiedad(propiedad_id: int, request: Request):
    """Elimina una propiedad existente"""
    try:
        # Verificar token
        token_data = verify_token_header(request)
        if not token_data:
            return JSONResponse(status_code=401, content={"message": "No autorizado"})
            
        # Verificar propiedad
        if not db.verificar_propiedad_usuario(propiedad_id, token_data["id"]):
            return JSONResponse(
                status_code=403, 
                content={"message": "No tienes permiso para eliminar esta propiedad"}
            )
        
        # Eliminar propiedad
        db.eliminar_propiedad(propiedad_id)
        
        logger.info(f"Propiedad eliminada: {propiedad_id} por usuario {token_data['id']}")
        return JSONResponse(status_code=200, content={"message": "Propiedad eliminada correctamente"})
    except Exception as e:
        logger.error(f"Error al eliminar propiedad {propiedad_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/mis-propiedades")
async def get_mis_propiedades(request: Request):
    """Obtiene las propiedades del usuario autenticado"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        propiedades = db.obtener_propiedades_por_usuario(token_data["id"])
        return JSONResponse(status_code=200, content={"propiedades": propiedades})
    except Exception as e:
        logger.error(f"Error al obtener propiedades del usuario {token_data['id']}: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})
