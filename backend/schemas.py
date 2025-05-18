##schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    contraseña: str

class UserOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: EmailStr

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    correo: EmailStr
    contraseña: str

class UpdateUser(BaseModel):
    nombre: str
    apellido: str
    correo: str

    class Config:
        orm_mode = True

class PasswordUpdate(BaseModel):
    user_id: int
    new_password: str
    
#################################################################

class EstudianteBase(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    edad: int
    grado: str
    genero: str
    presencia_padres: str
    trabaja: bool

class EstudianteCreate(EstudianteBase):
    pass

class Estudiante(EstudianteBase):
    id: int

    class Config:
        orm_mode = True