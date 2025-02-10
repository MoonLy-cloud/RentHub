from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.responses import FileResponse

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/inicio")
def read_root():
    return FileResponse("templates/index.html")

@app.get("/registro")
def read_root():
    return FileResponse("templates/registro.html")

@app.get("/login")
def read_root():
    return FileResponse("templates/login.html")

@app.get("/propiedades")
def read_root():
    return FileResponse("templates/propiedades.html")

@app.get("/dashboard_dueno")
def read_root():
    return FileResponse("templates/dashboard_dueno.html")

@app.get("/dashboard_usuario")
def read_root():
    return FileResponse("templates/dashboard_usuario.html")