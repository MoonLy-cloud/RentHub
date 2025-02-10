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
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String)
    apellido_p = Column(String)
    apellido_m = Column(String)
    correo = Column(String)
    id_metodo_pago = Column(Integer, ForeignKey('metodo_pago.id_metodo_pago'))

    metodo_pago = relationship("MetodoPago")
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
    descripcion = Column(String)
    ubicacion = Column(String)
    capacidad = Column(Integer)
    precio = Column(Float)
    id_cliente_dueno = Column(Integer, ForeignKey('cliente_dueno.id_cliente_dueno'))

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
