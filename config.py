import os
from pathlib import Path

# Directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent

# Configuración de la aplicación
CONFIG = {
    # Seguridad
    "JWT_SECRET_KEY": os.environ.get("JWT_SECRET_KEY", "tu_clave_secreta_muy_segura"),  # ¡Cambiar en producción!
    "JWT_ALGORITHM": "HS256",
    "JWT_EXPIRATION_MINUTES": 60 * 24 * 7,  # 1 semana
    
    # Rutas de archivos
    "UPLOAD_DIR": "static/uploads/profile",
    "IMAGES_DIR": "static/uploads/properties",
    
    # Configuración CORS
    "ALLOWED_ORIGINS": [
        "http://127.0.0.1:8000", 
        "http://localhost:8000"
    ],
    
    # API Keys
    "MAPBOX_TOKEN": os.environ.get("MAPBOX_TOKEN", "pk.eyJ1IjoibW9vbmx5MTIiLCJhIjoiY204bjNreGduMG1weTJtcHE5OGdtejJvNCJ9.pdpFMcxEu9w0np44GEEu4g"),
    
    # Database
    "DB_PATH": os.path.join(BASE_DIR, "Database", "database.db"),
    
    # Logging
    "LOG_LEVEL": os.environ.get("LOG_LEVEL", "INFO"),
}
