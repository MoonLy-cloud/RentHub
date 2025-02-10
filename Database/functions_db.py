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

