from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Database.functions_db as db
from utils.auth import verify_token_header
from utils.logger import logger

router = APIRouter(tags=["Pagos"])

@router.post("/api/conectar-paypal")
async def conectar_paypal(request: Request):
    """Conecta una cuenta de PayPal al usuario"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        data = await request.json()
        paypal_email = data.get("paypal_email")
        
        if not paypal_email:
            return JSONResponse(status_code=400, content={"message": "Email de PayPal no proporcionado"})
            
        # Actualizar email de PayPal
        db.actualizar_paypal(token_data["id"], paypal_email)
        
        logger.info(f"PayPal conectado para usuario {token_data['id']}")
        return JSONResponse(status_code=200, content={"message": "PayPal conectado correctamente"})
    except Exception as e:
        logger.error(f"Error al conectar PayPal: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})

@router.delete("/api/desconectar-paypal")
async def desconectar_paypal(request: Request):
    """Desconecta la cuenta de PayPal del usuario"""
    # Verificar token
    token_data = verify_token_header(request)
    if not token_data:
        return JSONResponse(status_code=401, content={"message": "No autorizado"})
        
    try:
        # Eliminar conexión PayPal
        db.actualizar_paypal(token_data["id"], None)
        
        logger.info(f"PayPal desconectado para usuario {token_data['id']}")
        return JSONResponse(status_code=200, content={"message": "PayPal desconectado correctamente"})
    except Exception as e:
        logger.error(f"Error al desconectar PayPal: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})
