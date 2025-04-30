from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import verify_token_header
from config import CONFIG
import jwt
from utils.logger import logger

router = APIRouter(tags=["Transacciones"])

@router.post("/api/transacciones")
async def registrar_transaccion(request: Request):
    """Registra una nueva transacción de renta"""
    # Log para depuración
    logger.info("\n----- NUEVA TRANSACCIÓN -----")

    # Intentar obtener token (opcional para esta ruta)
    auth_header = request.headers.get("Authorization")
    usuario_id = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, CONFIG["JWT_SECRET_KEY"], algorithms=[CONFIG["JWT_ALGORITHM"]])
            usuario_id = payload["id"]
            logger.info(f"Transacción con usuario autenticado ID: {usuario_id}")
        except Exception as e:
            logger.error(f"Error en token de transacción: {str(e)}")
    else:
        logger.info("Transacción anónima (sin token)")
    
    try:
        data = await request.json()
        logger.info(f"Datos de transacción recibidos: {data}")
        
        # Validar datos
        required_fields = ["propiedad_id", "orden_id", "monto", "estado"]
        for field in required_fields:
            if field not in data:
                return JSONResponse(
                    status_code=400, 
                    content={"message": f"Campo requerido faltante: {field}"}
                )
        
        # Registrar transacción
        transaccion_id = db.registrar_transaccion(
            usuario_id=usuario_id,
            propiedad_id=data["propiedad_id"],
            orden_id=data["orden_id"],
            monto=data["monto"],
            estado=data["estado"]
        )
        
        logger.info(f"Transacción registrada con ID: {transaccion_id}")
        
        # Actualizar disponibilidad
        db.actualizar_disponibilidad_propiedad(data["propiedad_id"], False)
        
        return JSONResponse(status_code=200, content={
            "message": "Transacción registrada correctamente",
            "transaccion_id": transaccion_id
        })
    except Exception as e:
        logger.error(f"ERROR EN TRANSACCIÓN: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.get("/api/mis-transacciones")
async def get_mis_transacciones(request: Request):
    """Obtiene las transacciones del usuario autenticado"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        # Obtener transacciones
        transacciones = db.obtener_transacciones_por_propietario(token_data["id"])
        
        # Enriquecer datos
        for transaccion in transacciones:
            # Datos de propiedad
            propiedad = db.obtener_propiedad_por_id(transaccion["id_propiedad"])
            if propiedad:
                transaccion["propiedad"] = propiedad
                
            # Datos de inquilino
            if transaccion["id_usuario"]:
                inquilino = db.obtener_usuario_por_id(transaccion["id_usuario"])
                if inquilino:
                    transaccion["inquilino"] = {
                        "id": inquilino["id"],
                        "nombre": inquilino["nombre"],
                        "apellido1": inquilino["apellido1"],
                        "apellido2": inquilino["apellido2"],
                        "correo": inquilino["correo"],
                        "imagen_perfil": inquilino.get("imagen_perfil", "/static/imgs/user.gif")
                    }
                else:
                    transaccion["inquilino"] = {
                        "nombre": "Usuario",
                        "apellido1": "Desconocido",
                        "correo": "No disponible",
                        "imagen_perfil": "/static/imgs/user.gif"
                    }
        
        logger.info(f"Transacciones obtenidas para usuario {token_data['id']}: {len(transacciones)}")            
        return JSONResponse(status_code=200, content={"transacciones": transacciones})
    except Exception as e:
        logger.error(f"Error al obtener transacciones: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})
