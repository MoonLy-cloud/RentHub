from urllib import request

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import FileResponse
import Database.functions_db as db
import json
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# Raiz del proyecto
@app.get("/")
def read_root():
    return FileResponse("templates/index.html")


# Ruta de formulario de registro
@app.get("/register")
def read_root():
    return FileResponse("templates/RegisterUser.html")


# Manejo del registro del usuario
@app.post("/register")
async def register_user(request: Request):
    user_data = await request.json()

    #Verificar si el usuario ya existe
    if db.usuario_existe(user_data["email"]):
        return JSONResponse(status_code=400, content={"message": "Usuario ya Existente"})
    else:
        db.guardar_usuario(user_data["name"], user_data["lastName"], user_data["secondLastName"], user_data["email"],
                           user_data["password"], user_data["confirmPassword"])
        return JSONResponse(status_code=200, content={"message": "Usuario ya Existente"})


# Ruta de formulario de login
@app.get("/login")
def read_root():
    return FileResponse("templates/Login.html")


# Manejo del acceso a la cuenta de usuario
@app.post("/login")
async def login_user(request: Request):
    user_data = await request.json()
    json_file = "users.json"

    with open(json_file, "r") as f:
        users = json.load(f)

    for user in users:
        if user["email"] == user_data["username"] and user["password"] == user_data["password"]:
            return JSONResponse(status_code=200, content={"message": "Usuario autenticado exitosamente"})

    return JSONResponse(status_code=401, content={"message": "Credenciales incorrectas"})


@app.get("/propiedades")
def read_root():
    return FileResponse("templates/propiedades.html")


@app.get("/dashboard_dueno")
def read_root():
    return FileResponse("templates/dashboard_dueno.html")


@app.get("/dashboard_usuario")
def read_root():
    return FileResponse("templates/Dashboard_usuario.html")
