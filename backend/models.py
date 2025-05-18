#models.py
from sqlalchemy import String,Integer,Column, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    apellido = Column(String(100))
    correo = Column(String(120), unique=True, index=True)
    contraseña = Column(String(255))
    estudiantes = relationship("Estudiante", back_populates="docente", cascade="all, delete-orphan")

## recien agregado

# Modelo de Estudiante 
class Estudiante(Base):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    apellido_paterno = Column(String(100))
    apellido_materno = Column(String(100))
    edad = Column(Integer, nullable=False)
    grado = Column(String(10))
    genero = Column(String(1))
    presencia_padres = Column(String(20))
    trabaja = Column(Boolean, nullable=False)

    docente_id = Column(Integer, ForeignKey("users.id"))  
    docente = relationship("User", back_populates="estudiantes")  

