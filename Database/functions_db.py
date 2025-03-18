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


def obtener_propiedades():
    propiedades = session.query(Propiedad).all()
    resultado = []

    for propiedad in propiedades:
        prop_dict = {
            'id': propiedad.id_propiedad,
            'nombre': propiedad.nombre,
            'direccion': propiedad.direccion,
            'descripcion': propiedad.descripcion,
            'precio': propiedad.precio,
            'imagen': propiedad.imagen,
            'disponible': propiedad.disponible,
            'id_propietario': propiedad.id_propietario
        }
        resultado.append(prop_dict)

    return resultado

def registrar_propiedad(nombre, direccion, descripcion, precio, imagen, disponible, id_propietario):
    propiedad = Propiedad(
        nombre=nombre,
        direccion=direccion,
        descripcion=descripcion,
        precio=precio,
        imagen=imagen,
        disponible=disponible,
        id_propietario=id_propietario
    )

    session.add(propiedad)
    session.commit()

    return propiedad.id_propiedad

def obtener_usuario_por_email(correo):
    usuario = session.query(Usuario).filter(Usuario.correo == correo).first()
    if usuario:
        return {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido_p": usuario.apellido_p,
            "apellido_m": usuario.apellido_m,
            "correo": usuario.correo
        }
    return None

def obtener_usuario_por_id(usuario_id):
    usuario = session.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if usuario:
        return {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido_p": usuario.apellido_p,
            "apellido_m": usuario.apellido_m,
            "correo": usuario.correo
        }
    return None

def obtener_propiedades_por_usuario(usuario_id):
    propiedades = session.query(Propiedad).filter(Propiedad.id_propietario == usuario_id).all()
    resultado = []

    for propiedad in propiedades:
        prop_dict = {
            'id': propiedad.id_propiedad,
            'nombre': propiedad.nombre,
            'direccion': propiedad.direccion,
            'descripcion': propiedad.descripcion,
            'precio': propiedad.precio,
            'imagen': propiedad.imagen,
            'disponible': propiedad.disponible,
            'id_propietario': propiedad.id_propietario
        }
        resultado.append(prop_dict)

    return resultado

def verificar_propiedad_usuario(propiedad_id, usuario_id):
    return session.query(Propiedad).filter(
        Propiedad.id_propiedad == propiedad_id,
        Propiedad.id_propietario == usuario_id
    ).count() > 0

def eliminar_propiedad(propiedad_id):
    propiedad = session.query(Propiedad).filter(Propiedad.id_propiedad == propiedad_id).first()
    if propiedad:
        session.delete(propiedad)
        session.commit()
        return True
    return False