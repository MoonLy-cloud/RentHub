from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Importar todas las clases de tu modelo
from Database.tables_db import Base, Usuario, ClienteDueno, Propiedad, Servicio, MetodoPago, Transaccion

# Crear el motor de la base de datos
db_path = os.path.join(os.path.dirname(__file__), 'database.db')
engine = create_engine(f'sqlite:///{db_path}')

# Crear todas las tablas
Base.metadata.create_all(engine)

# Crear una sesión
Session = sessionmaker(bind=engine)
session = Session()

def guardar_usuario(nombre, apellido_p, apellido_m, correo, contrasena, contrasena_confirmacion):
    usuario = Usuario(
        nombre=nombre,
        apellido_p=apellido_p,
        apellido_m=apellido_m,
        correo=correo,
        contrasena=contrasena,
        contrasena_confirmacion=contrasena_confirmacion
    )

    session.add(usuario)
    session.commit()

    return usuario

def usuario_existe(correo):
    return session.query(Usuario).filter(Usuario.correo == correo).count() > 0

def verificar_contrasena(correo, contrasena):
    return session.query(Usuario).filter(Usuario.correo == correo, Usuario.contrasena == contrasena).count() > 0