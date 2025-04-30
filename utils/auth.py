import jwt
from datetime import datetime, timedelta
from fastapi import Request
from typing import Optional, Dict, Any

import sys
import os
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CONFIG
import Database.functions_db as db

def create_access_token(data: Dict[str, Any]) -> str:
    """
    Crea un token JWT con los datos proporcionados.
    
    Args:
        data: Diccionario con datos a incluir en el token
        
    Returns:
        Token JWT codificado como string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=CONFIG["JWT_EXPIRATION_MINUTES"])
    to_encode.update({"exp": expire})
    
    return jwt.encode(
        to_encode, 
        CONFIG["JWT_SECRET_KEY"], 
        algorithm=CONFIG["JWT_ALGORITHM"]
    )

def verify_token_header(request: Request) -> Optional[Dict[str, Any]]:
    """
    Verifica el token JWT en el encabezado Authorization.
    
    Args:
        request: Objeto de solicitud FastAPI
        
    Returns:
        Payload del token si es válido, None en caso contrario
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, 
            CONFIG["JWT_SECRET_KEY"], 
            algorithms=[CONFIG["JWT_ALGORITHM"]]
        )
        
        # Verificar si el usuario sigue existiendo en la base de datos
        usuario = db.obtener_usuario_por_id(payload["id"])
        if not usuario:
            return None
            
        return payload
    except jwt.ExpiredSignatureError:
        # Token expirado
        return None
    except jwt.InvalidTokenError:
        # Token inválido 
        return None
    except Exception as e:
        print(f"Error al verificar token: {str(e)}")
        return None
