##schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

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
    Codigo_estudiante: str
    edad: int
    grado: int
    genero: str
    presencia_padres: str
    trabaja: bool

class EstudianteCreate(EstudianteBase):
    pass

class Estudiante(EstudianteBase):
    id: int

    class Config:
        orm_mode = True
        
#recien agregado

class RendimientoAcademicoBase(BaseModel):
    curso: str
    trimestre: int
    asistencia: float
    nota_trimestre: float
    conducta: float
    estudiante_id: int

class RendimientoAcademicoCreate(RendimientoAcademicoBase):
    pass

class EstudianteInfo(BaseModel):
    id: int
    Codigo_estudiante: str
    grado: int
    presencia_padres: str
    trabaja: bool

    class Config:
        orm_mode = True

class RendimientoAcademicoOut(BaseModel):
    id: int
    curso: str
    trimestre: int
    asistencia: float
    nota_trimestre: float
    conducta: float
    estudiante: EstudianteInfo

    class Config:
        orm_mode = True
        
class RendimientoAcademicoUpdate(BaseModel):
    curso: str
    trimestre: int
    asistencia: float
    nota_trimestre: float
    conducta: float
    
###################################################
class PrediccionInput(BaseModel):
    estudiante_id: int
    curso: str
    trimestre: int
    
class ResultadoPrediccionCreate(BaseModel):
    rendimiento: str
    factores_riesgo: Optional[str]
    observacion: Optional[str]
    estudiante_id: int
    #nuevo
    user_id: int

class ResultadoPrediccionOut(ResultadoPrediccionCreate):
    id: int

    class Config:
        orm_mode = True

#nuevo
class EstudianteConResultado(BaseModel):
    id: int
    Codigo_estudiante: str
    grado: int
    curso: str
    rendimiento: Optional[str]
    factores_riesgo: Optional[str]
    observacion: Optional[str]

    class Config:
        orm_mode = True
        
class ResultadoPrediccionOut(BaseModel):
    estudiante_id: int
    Codigo_estudiante: str
    curso: str
    trimestre: int
    rendimiento: str
    factores_riesgo: str | None = None
    observacion: str | None = None

    class Config:
        orm_mode = True
        
class ReporteAcademico(BaseModel):
    estudiante_id: int
    codigo_estudiante: str
    nombre: str
    apellido: str
    grado: int
    curso: str
    trimestre: int
    asistencia: float
    nota_trimestre: float
    conducta: float
    rendimiento: Optional[str]
    factores_riesgo: Optional[str]
    observacion: Optional[str]
    fecha_registro: Optional[datetime] 

    class Config:
        orm_mode = True
        
class EstudianteRiesgoOut(BaseModel):
    Codigo_estudiante: str
    grado: int
    curso: str
    trimestre: int
    nota_trimestre: float
    causas_riesgo: List[str]
    rendimiento: Optional[str]
    
class HistorialPrediccionResponse(BaseModel):
    Codigo_estudiante: str
    curso: str
    trimestre: int
    nota: float
    asistencia: float
    conducta: float
    rendimiento: str
    fecha_prediccion: datetime
    observacion: str
    estudiante_id: int

    class Config:
        orm_mode = True