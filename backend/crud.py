# crud.py
from sqlalchemy.orm import Session
import models, schemas
import joblib
from passlib.context import CryptContext
from utils import hash_password

################################### USUARIO - DOCENTE ########################################

def update_user(db: Session, user_id: int, user_data) -> models.User:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.nombre = user_data.nombre
        db_user.apellido = user_data.apellido
        db_user.correo = user_data.correo
        db.commit()
        db.refresh(db_user)
        return db_user
    return None

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def update_user_password(db: Session, user_id: int, new_password: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.contraseña = hash_password(new_password)
        db.commit()
        db.refresh(user)
        return user
    return None

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        
################################### DATOS - ESTUDIANTE ########################################

def crear_estudiante(db: Session, student: schemas.EstudianteCreate, docente_id: int):
    db_estudiante = models.Estudiante(**student.dict(), docente_id=docente_id)
    db.add(db_estudiante)
    db.commit()
    db.refresh(db_estudiante)
    return db_estudiante

def obtener_estudiantes(db: Session):
    return db.query(models.Estudiante).all()

def obtener_estudiante(db: Session, estudiante_id: int):
    return db.query(models.Estudiante).filter(models.Estudiante.id == estudiante_id).first()

def actualizar_estudiante(db: Session, estudiante_id: int, estudiante: schemas.EstudianteCreate):
    db_estudiante = obtener_estudiante(db, estudiante_id)
    if db_estudiante is None:
        return None
    for key, value in estudiante.dict().items():
        setattr(db_estudiante, key, value)
    db.commit()
    db.refresh(db_estudiante)
    return db_estudiante

def eliminar_estudiante(db: Session, estudiante_id: int):
    db_estudiante = obtener_estudiante(db, estudiante_id)
    if db_estudiante is None:
        return None
    db.delete(db_estudiante)
    db.commit()
    return db_estudiante