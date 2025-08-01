# crud.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from fastapi import HTTPException
import models, schemas
import joblib
from passlib.context import CryptContext
from utils import hash_password
from models import Estudiante, ResultadoPrediccion, User, RendimientoAcademico

################################### USUARIO - DOCENTE ########################################

def update_user(db: Session, user_id: int, user_data) -> models.User:
    # Verificar si el correo ya está usado por otro usuario
    correo_existente = db.query(models.User).filter(
        models.User.correo == user_data.correo,
        models.User.id != user_id  # excluir al usuario actual
    ).first()

    if correo_existente:
        raise HTTPException(
            status_code=409,
            detail="El correo ya está registrado por otro usuario"
        )

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
    # Verificar si el código ya existe
    estudiante_existente = db.query(models.Estudiante).filter(
        models.Estudiante.Codigo_estudiante == student.Codigo_estudiante
    ).first()

    if estudiante_existente:
        raise HTTPException(
            status_code=409,
            detail="El código del estudiante ya está registrado"
        )

    # Crear el nuevo estudiante si no hay duplicado
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
    # Verificar si el código ya existe en otro estudiante
    existe_codigo = db.query(models.Estudiante).filter(
        models.Estudiante.Codigo_estudiante == estudiante.Codigo_estudiante,
        models.Estudiante.id != estudiante_id  # excluir al estudiante actual
    ).first()

    if existe_codigo:
        raise HTTPException(
            status_code=409,
            detail="El código del estudiante ya está registrado por otro estudiante"
        )

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
    # Verificar si ya existe un registro para este estudiante, curso y trimestre
    existe_registro = db.query(models.RendimientoAcademico).filter(
        models.RendimientoAcademico.estudiante_id == registro.estudiante_id,
        models.RendimientoAcademico.curso == registro.curso,
        models.RendimientoAcademico.trimestre == registro.trimestre
    ).first()

    if existe_registro:
        raise HTTPException(status_code=400, detail="El estudiante ya tiene una nota registrada para este curso y trimestre.")

    # Si no existe, lo insertamos en la base de datos
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

def actualizar_registro_academico(db: Session, registro_id: int, registro_data: schemas.RendimientoAcademicoUpdate):
    registro = db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.id == registro_id).first()

    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    # Validar si ya existe otro registro con el mismo estudiante, curso y trimestre
    existe_registro = db.query(models.RendimientoAcademico).filter(
        models.RendimientoAcademico.estudiante_id == registro.estudiante_id,  # Usamos el estudiante actual
        models.RendimientoAcademico.curso == registro_data.curso,
        models.RendimientoAcademico.trimestre == registro_data.trimestre,
        models.RendimientoAcademico.id != registro_id  # Excluimos el registro que estamos editando
    ).first()

    if existe_registro:
        raise HTTPException(status_code=400, detail="Ya existe una nota para este estudiante en este curso y trimestre.")

    # Si no hay conflicto, se actualiza
    for key, value in registro_data.dict().items():
        setattr(registro, key, value)

    db.commit()
    db.refresh(registro)
    return registro

def eliminar_registro_academico(db: Session, registro_id: int):
    registro = db.query(models.RendimientoAcademico).filter(models.RendimientoAcademico.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    estudiante_id = registro.estudiante_id
    curso = registro.curso
    trimestre = registro.trimestre

    # Eliminar el registro
    db.delete(registro)
    db.commit()

    # Verificar si hay otras notas para ese estudiante, curso y trimestre
    notas_restantes = db.query(models.RendimientoAcademico).filter_by(
        estudiante_id=estudiante_id,
        curso=curso,
        trimestre=trimestre
    ).all()

    if not notas_restantes:
        # Si no quedan notas, eliminar la predicción asociada
        db.query(models.ResultadoPrediccion).filter_by(
            estudiante_id=estudiante_id,
            curso=curso,
            trimestre=trimestre
        ).delete()
        db.commit()
    else:
        # Recalcular la predicción (opcional)
        pass


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
            ResultadoPrediccion.observacion,
            ResultadoPrediccion.mensaje_umbral
            
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
            "observacion": r.observacion,
            "mensaje_umbral": r.mensaje_umbral
        }
        for r in resultados
    ]

##########################################

from sqlalchemy import extract

def obtener_reportes_academicos_por_docente(db: Session, user_id: int, mes: int = None, anio: int = None, grado: int = None):
    query = (
        db.query(
            Estudiante.id.label("estudiante_id"),
            Estudiante.Codigo_estudiante.label("codigo_estudiante"),
            User.nombre.label("nombre"),
            User.apellido.label("apellido"),
            Estudiante.grado,
            RendimientoAcademico.curso,
            RendimientoAcademico.trimestre,
            RendimientoAcademico.asistencia,
            RendimientoAcademico.nota_trimestre,
            RendimientoAcademico.conducta,
            ResultadoPrediccion.rendimiento,
            ResultadoPrediccion.factores_riesgo,
            ResultadoPrediccion.observacion,
            ResultadoPrediccion.mensaje_umbral,
            RendimientoAcademico.fecha_registro.label("fecha_registro") 
        )
        .join(User, Estudiante.docente_id == User.id)
        .join(RendimientoAcademico, RendimientoAcademico.estudiante_id == Estudiante.id)
        .outerjoin(ResultadoPrediccion, 
                   (ResultadoPrediccion.estudiante_id == Estudiante.id) & 
                   (ResultadoPrediccion.trimestre == RendimientoAcademico.trimestre) & 
                   (ResultadoPrediccion.curso == RendimientoAcademico.curso))
        .filter(User.id == user_id)
    )

    if mes and anio:
        query = query.filter(
            extract('month', RendimientoAcademico.fecha_registro) == mes,
            extract('year', RendimientoAcademico.fecha_registro) == anio
        )
    
    if grado:
        query = query.filter(Estudiante.grado == grado)

    return query.all()


##########################nuevo del nuevo

def obtener_ranking_por_trimestre(db: Session, docente_id: int, trimestre: int, grado: int | None = None):
    filtros = [
        Estudiante.docente_id == docente_id,
        ResultadoPrediccion.trimestre == trimestre
    ]
    if grado is not None:
        filtros.append(Estudiante.grado == grado)

    resultados = db.query(ResultadoPrediccion).\
        join(ResultadoPrediccion.estudiante).\
        filter(*filtros).\
        options(joinedload(ResultadoPrediccion.estudiante)).\
        all()

    agrupado = {}

    for r in resultados:
        codigo = r.estudiante.Codigo_estudiante

        # Buscar asistencia desde RendimientoAcademico
        asistencia_registro = db.query(RendimientoAcademico).filter(
            RendimientoAcademico.estudiante_id == r.estudiante_id,
            RendimientoAcademico.trimestre == trimestre,
            RendimientoAcademico.curso == r.curso
        ).first()
        asistencia_valor = asistencia_registro.asistencia if asistencia_registro else 0

        # Buscar nota desde RendimientoAcademico también
        nota_valor = asistencia_registro.nota_trimestre if asistencia_registro else 0

        if codigo not in agrupado:
            agrupado[codigo] = {
                "codigo_estudiante": codigo,
                "asistencias": [],
                "notas": [],
                "cursos_en_riesgo": [],
                "rendimientos": []
            }

        agrupado[codigo]["asistencias"].append(asistencia_valor)
        agrupado[codigo]["notas"].append(nota_valor)
        agrupado[codigo]["rendimientos"].append(r.rendimiento)

        if r.rendimiento == "Bajo":
            agrupado[codigo]["cursos_en_riesgo"].append(r.curso)

    estudiantes = []
    for datos in agrupado.values():
        asistencia_prom = sum(datos["asistencias"]) / len(datos["asistencias"]) if datos["asistencias"] else 0
        calificacion_prom = sum(datos["notas"]) / len(datos["notas"]) if datos["notas"] else 0
        rendimiento_final = max(set(datos["rendimientos"]), key=datos["rendimientos"].count)

        estudiantes.append({
            "codigo_estudiante": datos["codigo_estudiante"],
            "asistencia_promedio": round(asistencia_prom, 2),
            "calificacion_promedio": round(calificacion_prom, 2),
            "rendimiento": rendimiento_final,
            "cursos_en_riesgo": datos["cursos_en_riesgo"]
        })

    estudiantes.sort(key=lambda x: x["calificacion_promedio"])

    return estudiantes


