import os
import uuid
import shutil
from fastapi import UploadFile
from typing import Tuple, Optional, List

import sys
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CONFIG

# Extensiones permitidas para imágenes
ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

def validate_image(file: UploadFile) -> bool:
    """
    Valida si un archivo es una imagen con extensión permitida.
    
    Args:
        file: Archivo a validar
        
    Returns:
        True si es válido, False en caso contrario
    """
    file_extension = os.path.splitext(file.filename)[1].lower()
    return file_extension in ALLOWED_EXTENSIONS

def save_uploaded_file(
    file: UploadFile, 
    directory: str = CONFIG["UPLOAD_DIR"]
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Guarda un archivo subido al servidor.
    
    Args:
        file: Archivo subido
        directory: Directorio donde guardar el archivo
        
    Returns:
        Tupla con (éxito, ruta_db, ruta_filesystem)
    """
    try:
        # Crear directorio si no existe
        os.makedirs(directory, exist_ok=True)
        
        # Generar nombre único para el archivo
        file_extension = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Rutas
        fs_path = os.path.join(directory, unique_filename)
        db_path = f"/{directory}/{unique_filename}"
        
        # Guardar archivo
        with open(fs_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return True, db_path, fs_path
        
    except Exception as e:
        print(f"Error al guardar archivo: {str(e)}")
        return False, None, None
    finally:
        file.file.close()

def delete_file(path: str) -> bool:
    """
    Elimina un archivo del sistema.
    
    Args:
        path: Ruta al archivo
        
    Returns:
        True si se eliminó correctamente, False en caso contrario
    """
    try:
        if os.path.exists(path) and os.path.isfile(path):
            os.remove(path)
            return True
        return False
    except Exception as e:
        print(f"Error al eliminar archivo: {str(e)}")
        return False
