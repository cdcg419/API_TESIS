# crud.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
import models, schemas
import joblib
from passlib.context import CryptContext
from utils import hash_password
from models import RendimientoAcademico
from models import Estudiante, ResultadoPrediccion, User

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

def obtener_estudiante_por_id_y_docente(db: Session, estudiante_id: int, docente_id: int):
    return db.query(models.Estudiante).filter(
        models.Estudiante.id == estudiante_id,
        models.Estudiante.docente_id == docente_id
    ).first()

################################### NOTAS DEL ESTUDIANTE ########################################

def crear_registro_academico(db: Session, registro: schemas.RendimientoAcademicoCreate):
    db_registro = models.RendimientoAcademico(**registro.dict())
    db.add(db_registro)
    db.commit()
    db.refresh(db_registro)
    return db_registro

def obtener_registros_por_estudiante(db: Session, estudiante_id: int):
    return db.query(models.RendimientoAcademico).filter(
        models.RendimientoAcademico.estudiante_id == estudiante_id
    ).all()

def obtener_registros_por_estudiante(db: Session, estudiante_id: int):
    return db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.estudiante_id == estudiante_id).all()

def actualizar_registro_academico(db: Session, registro_id: int, registro_data: schemas.RendimientoAcademicoCreate):
    registro = db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.id == registro_id).first()
    if registro:
        for key, value in registro_data.dict().items():
            setattr(registro, key, value)
        db.commit()
        db.refresh(registro)
        return registro
    raise HTTPException(status_code=404, detail="Registro no encontrado")

def eliminar_registro_academico(db: Session, registro_id: int):
    registro = db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.id == registro_id).first()
    if registro:
        db.delete(registro)
        db.commit()
    else:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

def obtener_registro_por_id(db: Session, id: int):
    return db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.id == id).first()

#####################################################################################

def guardar_rendimiento_academico(db, datos, rendimiento, riesgos, Observacion, user_id):
    nuevo_registro = RendimientoAcademico(
        curso=datos.curso,
        trimestre=datos.trimestre,
        asistencia=datos.asistencia,
        nota_trimestre=datos.nota_trimestre,
        conducta=datos.conducta,
        estudiante_id=datos.estudiante_id,
        rendimiento_predicho=rendimiento,
        riesgos_detectados=', '.join(riesgos),
        observacion_final=Observacion,
        ##nuevo
        user_id=user_id
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

def crear_resultado_prediccion(db: Session, resultado: schemas.ResultadoPrediccionCreate):
    nuevo_resultado = models.ResultadoPrediccion(**resultado.dict())
    db.add(nuevo_resultado)
    db.commit()
    db.refresh(nuevo_resultado)
    return nuevo_resultado

def obtener_estudiantes_con_resultado(db: Session):
    resultados = (
        db.query(
            Estudiante.id,
            Estudiante.Codigo_estudiante,
            Estudiante.grado,
            ResultadoPrediccion.curso,
            ResultadoPrediccion.rendimiento,
            ResultadoPrediccion.factores_riesgo,
            ResultadoPrediccion.observacion
            
        )
        .join(ResultadoPrediccion, Estudiante.id == ResultadoPrediccion.estudiante_id)
        .all()
    )
    return resultados

##nuevo
def obtener_predicciones_por_docente(db: Session, docente_id: int):
    resultados = db.query(ResultadoPrediccion).\
        join(ResultadoPrediccion.estudiante).\
        filter(Estudiante.docente_id == docente_id).\
        options(joinedload(ResultadoPrediccion.estudiante)).\
        all()

    return [
        {
            "estudiante_id": r.estudiante_id,
            "Codigo_estudiante": r.estudiante.Codigo_estudiante,
            "curso": r.curso,
            "trimestre": r.trimestre,
            "rendimiento": r.rendimiento,
            "factores_riesgo": r.factores_riesgo,
            "observacion": r.observacion
        }
        for r in resultados
    ]


