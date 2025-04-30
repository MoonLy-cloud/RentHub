from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.cors import CORSMiddleware
import os

# Importar configuración
from config import CONFIG, BASE_DIR
from utils.logger import logger

# Importar los routers
from api import auth, propiedades, usuarios, transacciones, admin, pagos, utilidades

# Crear nueva instancia de FastAPI
app = FastAPI(
    title="RentHub API",
    description="API para aplicación de alquiler de propiedades",
    version="1.0.0"
)

# Evento de inicio
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando aplicación RentHub...")
    
    # Inicializar base de datos
    from Database import functions_db
    functions_db.inicializar_base_datos()

    # Crear directorios necesarios
    directorios = [
        CONFIG["UPLOAD_DIR"],
        CONFIG["IMAGES_DIR"]
    ]
    
    for directorio in directorios:
        os.makedirs(directorio, exist_ok=True)
        try:
            os.chmod(directorio, 0o755)
        except Exception as e:
            logger.warning(f"No se pudieron establecer permisos para {directorio}: {e}")

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/static/components", StaticFiles(directory="static/components"), name="components")
templates = Jinja2Templates(directory="templates")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG["ALLOWED_ORIGINS"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas principales (páginas HTML)
@app.get("/")
def read_root():
    return FileResponse("templates/index.html")

@app.get("/publicar")
def publicar_page():
    return FileResponse("templates/publicar.html")

@app.get("/propiedades")
def propiedades_page():
    return FileResponse("templates/propitiates.html")

@app.get("/mi-perfil")
def mi_perfil_page():
    return FileResponse("templates/perfil.html")

@app.get("/admin")
def admin_page():
    return FileResponse("templates/admin.html")

# Incluir routers
app.include_router(auth.router)
app.include_router(propiedades.router)
app.include_router(usuarios.router)
app.include_router(transacciones.router)
app.include_router(admin.router)
app.include_router(pagos.router)
app.include_router(utilidades.router)

# Mensaje de inicio
if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor con uvicorn...")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)