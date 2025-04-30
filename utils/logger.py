import logging
import os
from datetime import datetime

import sys
# Añadir la ruta del proyecto al path para importaciones relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CONFIG, BASE_DIR

# Configuración de logging
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Crear un logger para la aplicación
def setup_logger(name: str = "renthub") -> logging.Logger:
    """
    Configura y devuelve un logger con el nombre especificado.
    
    Args:
        name: Nombre del logger
        
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Establecer nivel de log basado en configuración
    log_level = getattr(logging, CONFIG["LOG_LEVEL"])
    logger.setLevel(log_level)
    
    # Crear manejador para consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Crear manejador para archivo
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = os.path.join(LOG_DIR, f"{today}_{name}.log")
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(log_level)
    
    # Formato para los logs
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Añadir manejadores al logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Crear logger principal
logger = setup_logger()
