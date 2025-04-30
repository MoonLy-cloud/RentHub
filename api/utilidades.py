from fastapi import APIRouter
from fastapi.responses import JSONResponse

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CONFIG

router = APIRouter(tags=["Utilidades"])

@router.get("/api/mapbox-token")
async def get_mapbox_token():
    """Obtiene el token de Mapbox para el cliente"""
    return JSONResponse(status_code=200, content={"token": CONFIG["MAPBOX_TOKEN"]})
