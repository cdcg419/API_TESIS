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
    estudiantes = relationship("Student", back_populates="docente", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    edad = Column(Integer, nullable=False)
    genero = Column(String(2), nullable=False)
    grado = Column(Integer, nullable=False)
    presencia_padres = Column(String(100), nullable=False)
    trabaja = Column(Boolean, nullable=False)
    docente_id = Column(Integer, ForeignKey("users.id"))  # relación con el usuario
    docente = relationship("User", back_populates="estudiantes")
    