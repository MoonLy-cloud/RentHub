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


def actualizar_paypal(id, paypal_email):
    try:
        usuario = session.query(Usuario).filter(Usuario.id_usuario == id).first()
        if usuario:
            usuario.paypal_email = paypal_email
            session.commit()
            return usuario.id_usuario
        return None
    except Exception as e:
        print(f"Error al actualizar PayPal: {str(e)}")
        session.rollback()
        raise

def actualizar_usuario(id, nombre, apellido1, apellido2, correo):
    try:
        usuario = session.query(Usuario).filter(Usuario.id_usuario == id).first()
        if usuario:
            usuario.nombre = nombre
            usuario.apellido_p = apellido1
            usuario.apellido_m = apellido2
            usuario.correo = correo
            session.commit()
            return usuario.id_usuario
        return None
    except Exception as e:
        print(f"Error al actualizar usuario: {str(e)}")
        session.rollback()
        raise

def actualizar_imagen_perfil(id, ruta_imagen):
    try:
        usuario = session.query(Usuario).filter(Usuario.id_usuario == id).first()
        if usuario:
            usuario.imagen_perfil = ruta_imagen
            session.commit()
            return usuario.id_usuario
        return None
    except Exception as e:
        print(f"Error al actualizar imagen de perfil: {str(e)}")
        session.rollback()
        raise

def verificar_contrasena_por_id(id, contrasena):
    usuario = session.query(Usuario).filter(Usuario.id_usuario == id).first()
    if not usuario:
        return False
    return usuario.contrasena == contrasena  # Deberías usar hash en producción

def actualizar_contrasena(id, nueva_contrasena):
    try:
        usuario = session.query(Usuario).filter(Usuario.id_usuario == id).first()
        if usuario:
            usuario.contrasena = nueva_contrasena  # Deberías usar hash en producción
            usuario.contrasena_confirmacion = nueva_contrasena
            session.commit()
            return usuario.id_usuario
        return None
    except Exception as e:
        print(f"Error al actualizar contraseña: {str(e)}")
        session.rollback()
        raise

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
    # Agregamos debugging
    print(f"Buscando usuario con ID: {usuario_id}")

    usuario = session.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()

    if usuario:
        print(f"Usuario encontrado: {usuario.nombre}")
        return {
            "id": usuario.id_usuario,  # Mantenemos consistencia con el token
            "nombre": usuario.nombre,
            "apellido1": usuario.apellido_p,
            "apellido2": usuario.apellido_m,
            "correo": usuario.correo,
            "paypal_email": usuario.paypal_email,
            "fecha_registro": usuario.fecha_registro.isoformat() if usuario.fecha_registro else None,
            "imagen_perfil": usuario.imagen_perfil or "/static/imgs/user.gif"  # Valor por defecto
        }
    else:
        print(f"Usuario con ID {usuario_id} no encontrado")
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


def inicializar_base_datos():
    """
    Inicializa la base de datos si no existe y configura los datos iniciales necesarios.
    """
    print("Inicializando base de datos...")

    # Verificar si ya existen métodos de pago
    metodos_pago = session.query(MetodoPago).all()
    if not metodos_pago:
        print("Creando métodos de pago iniciales...")
        metodos = [
            MetodoPago(tipo="PayPal"),
            MetodoPago(tipo="Tarjeta de Crédito"),
            MetodoPago(tipo="Efectivo")
        ]
        session.add_all(metodos)
        session.commit()
        print("Métodos de pago creados correctamente")

    # Verificar permisos de la base de datos
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    try:
        # Asegurar que el archivo tenga permisos adecuados (644 en Unix)
        if os.path.exists(db_path):
            os.chmod(db_path, 0o644)
            print(f"Permisos actualizados para la base de datos en: {db_path}")
    except Exception as e:
        print(f"Error al configurar permisos: {e}")

    print("Inicialización de base de datos completada")
    return True