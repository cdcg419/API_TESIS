#models.py
from sqlalchemy import String,Integer,Column, Boolean, Float, ForeignKey
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

# Modelo de Estudiante 
class Estudiante(Base):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    Codigo_estudiante = Column(String(10))
    edad = Column(Integer, nullable=False)
    grado = Column(Integer, nullable=False)
    genero = Column(String(1))
    presencia_padres = Column(String(20))
    trabaja = Column(Boolean, nullable=False)

    docente_id = Column(Integer, ForeignKey("users.id"))  
    docente = relationship("User", back_populates="estudiantes")  

## recien agregado

class RendimientoAcademico(Base):
    __tablename__ = "rendimiento_academico"

    id = Column(Integer, primary_key=True, index=True)
    curso = Column(String(100), nullable=False)
    trimestre = Column(Integer, nullable=False)
    asistencia = Column(Float, nullable=False)
    nota_trimestre = Column(Float, nullable=False)
    conducta = Column(Float, nullable=False)

    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"))
    estudiante = relationship("Estudiante", backref="registros_academicos")
