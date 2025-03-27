from sqlalchemy import Column, Integer, String, ForeignKey, Float, Table, DateTime
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

# Tabla intermedia para la relación muchos a muchos entre Usuario y Propiedad
renta_propiedad = Table(
    'renta_propiedad', Base.metadata,
    Column('id_usuario', Integer, ForeignKey('usuario.id_usuario')),
    Column('id_propiedad', Integer, ForeignKey('propiedad.id_propiedad'))
)


class Usuario(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    apellido_p = Column(String, nullable=False)
    apellido_m = Column(String, nullable=False)
    correo = Column(String, nullable=False, unique=True)
    contrasena = Column(String, nullable=False)
    contrasena_confirmacion = Column(String, nullable=False)
    fecha_registro = Column(DateTime, default=datetime.now)
    imagen_perfil = Column(String, nullable=True, default="/static/imgs/user.gif")
    paypal_email = Column(String, nullable=True)
    curp = Column(String(18), nullable=False, unique=True)
    id_metodo_pago = Column(Integer, ForeignKey('metodo_pago.id_metodo_pago'), nullable=True)
    rol = Column(String, default="usuario")  # Valores posibles: "usuario", "admin"

    # Modificar la relación para usar back_populates
    metodo_pago = relationship("MetodoPago", back_populates="usuarios")
    propiedades = relationship("Propiedad", secondary=renta_propiedad, back_populates="usuarios")


class ClienteDueno(Base):
    __tablename__ = 'cliente_dueno'
    id_cliente_dueno = Column(Integer, primary_key=True)
    nombre = Column(String)
    apellido_p = Column(String)
    apellido_m = Column(String)
    correo = Column(String)

    propiedades = relationship("Propiedad", back_populates="dueno")


class Propiedad(Base):
    __tablename__ = 'propiedad'
    id_propiedad = Column(Integer, primary_key=True)
    nombre = Column(String)
    direccion = Column(String)
    descripcion = Column(String)
    precio = Column(Float)
    imagen = Column(String)
    disponible = Column(Integer)
    id_propietario = Column(Integer, ForeignKey('cliente_dueno.id_cliente_dueno'))

    dueno = relationship("ClienteDueno", back_populates="propiedades")
    usuarios = relationship("Usuario", secondary=renta_propiedad, back_populates="propiedades")
    servicios = relationship("Servicio", back_populates="propiedad")


class Servicio(Base):
    __tablename__ = 'servicio'
    id_servicio = Column(Integer, primary_key=True)
    nombre = Column(String)
    descripcion = Column(String)
    precio = Column(Float)
    id_propiedad = Column(Integer, ForeignKey('propiedad.id_propiedad'))

    propiedad = relationship("Propiedad", back_populates="servicios")


class MetodoPago(Base):
    __tablename__ = 'metodo_pago'
    id_metodo_pago = Column(Integer, primary_key=True)
    tipo = Column(String)

    usuarios = relationship("Usuario", back_populates="metodo_pago")

class Transaccion(Base):
    __tablename__ = 'transaccion'
    id_transaccion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'))
    id_propiedad = Column(Integer, ForeignKey('propiedad.id_propiedad'))
    id_cliente_dueno = Column(Integer, ForeignKey('cliente_dueno.id_cliente_dueno'))
    monto_total = Column(Float)
    monto_dueno = Column(Float)
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario")
    propiedad = relationship("Propiedad")
    cliente_dueno = relationship("ClienteDueno")

if __name__ == "__main__":
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import os

    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    engine = create_engine(f'sqlite:///{db_path}')

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()