from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.responses import FileResponse
import json
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/register")
def read_root():
    return FileResponse("templates/RegisterUser.html")

@app.post("/register")
async def register_user(request: Request):
    # Get user data from request body
    user_data = await request.json()

    # Define the path to the JSON file
    json_file = "users.json"

    # Create empty users list if file doesn't exist
    if not os.path.exists(json_file):
        with open(json_file, "w") as f:
            json.dump([], f)

    # Read existing users
    with open(json_file, "r") as f:
        users = json.load(f)

    # Add new user
    users.append(user_data)

    # Save updated users list
    with open(json_file, "w") as f:
        json.dump(users, f, indent=4)

    return {"message": "Usuario registrado exitosamente"}

@app.get("/login")
def read_root():
    return FileResponse("templates/Login.html")

@app.get("/login")
async def login_user(request: Request):
    # Get user data from request body
    user_data = await request.json()

    # Define the path to the JSON file
    json_file = "users.json"

    # Read existing users
    with open(json_file, "r") as f:
        users = json.load(f)

    # Check if user exists
    for user in users:
        if user["email"] == user_data["email"] and user["password"] == user_data["password"]:
            return {"message": "Usuario autenticado exitosamente"}

    return {"message": "Credenciales incorrectas"}

@app.get("/propiedades")
def read_root():
    return FileResponse("templates/propiedades.html")

@app.get("/dashboard_dueno")
def read_root():
    return FileResponse("templates/dashboard_dueno.html")

@app.get("/dashboard_usuario")
def read_root():
    return FileResponse("templates/dashboard_usuario.html")