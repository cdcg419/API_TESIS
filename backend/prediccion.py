# prediccion.py
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import predict
from schemas import PrediccionInput
from database import get_db
from pydantic import BaseModel
import pandas as pd
# importar tu modelo de base de datos y función get_db
from models import Estudiante, RendimientoAcademico, ResultadoPrediccion, User
from database import get_db
from crud import obtener_estudiantes_con_resultado
from typing import List
from schemas import EstudianteConResultado, ReporteAcademico, EstudianteRiesgoOut
from crud import obtener_reportes_academicos_por_docente
import utils

router = APIRouter(
    prefix="/prediccion",
    tags=["Prediccion"]
)

class DatosPrediccion(BaseModel):
    asistencia: float
    nota_trimestre: float
    conducta: float

@router.post("/predecir")
def predecir(datos: DatosPrediccion):
    try:
        resultado = predecir_rendimiento(datos.asistencia, datos.nota_trimestre, datos.conducta)
        return {"rendimiento": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

##utils.get_current_user nuevo
@router.post("/predecir_rendimiento")
def predecir_rendimiento(input: PrediccionInput, db: Session = Depends(get_db),current_user: User = Depends(utils.get_current_user)):

    # Obtener datos del estudiante
    estudiante = db.query(Estudiante).filter(Estudiante.id == input.estudiante_id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Obtener datos de rendimiento académico
    rendimiento = db.query(RendimientoAcademico).filter(
        RendimientoAcademico.estudiante_id == input.estudiante_id,
        RendimientoAcademico.curso == input.curso,
        RendimientoAcademico.trimestre == input.trimestre
    ).first()
    if not rendimiento:
        raise HTTPException(status_code=404, detail="Datos académicos no encontrados")

    # Preparar DataFrame con toda la info y el mismo procesamiento que en Colab
    df = pd.DataFrame([{
        'edad': estudiante.edad,
        'genero': predict.genero_map.get(estudiante.genero, 0),
        'grado': estudiante.grado,
        'asistencia_categoria': predict.categoria_map[predict.categorize_assistance(rendimiento.asistencia)],
        'nota_trim_categoria': predict.categoria_map[predict.categorize_grades(rendimiento.nota_trimestre)],
        'conducta_trim_categoria': predict.categoria_map[predict.categorize_conduct(rendimiento.conducta)],
        'presencia_padres': predict.presencia_padres_map.get(estudiante.presencia_padres, 0),
        'trabaja': predict.trabaja_map.get(estudiante.trabaja, 0),
        # inicialmente vacío, luego llenaremos motivos
        'motivo_asistencia': 0,
        'motivo_presencia_padres': 0,
        'motivo_trabajo': 0,
    }])

    # Predecir motivos usando funciones y mapas
    rendimiento_text = 'Medio'  # se puede ajustar
    motivo_asistencia = predict.predecir_motivo_asistencia(rendimiento.asistencia, rendimiento_text)
    motivo_presencia_padres = predict.predecir_motivo_presencia_padres(predict.presencia_padres_map.get(estudiante.presencia_padres, 0), rendimiento_text)
    motivo_trabajo = predict.predecir_motivo_trabajo(predict.trabaja_map.get(estudiante.trabaja, 0), rendimiento_text)

    df['motivo_asistencia'] = predict.motivo_map[motivo_asistencia]
    df['motivo_presencia_padres'] = predict.motivo_map[motivo_presencia_padres]
    df['motivo_trabajo'] = predict.motivo_map[motivo_trabajo]

    # Predecir con el modelo RandomForest
    prediccion = predict.rf_model.predict(df)[0]

    rendimiento_labels = ['Bajo', 'Medio', 'Alto']
    rendimiento_alumno = rendimiento_labels[prediccion]

    # Identificar factores de riesgo
    factores_riesgo = []
    if motivo_asistencia in ['Bajo nivel de asistencia']:
        factores_riesgo.append('Bajo compromiso en asistencia escolar')
    if motivo_asistencia in ['Medio nivel de asistencia']:
        factores_riesgo.append('Nivel medio en compromiso en asistencia escolar')
    if motivo_presencia_padres in ['Sin padres', 'Tiene un solo padre/madre']:
        factores_riesgo.append('Bajo acompañamiento familiar')
    if motivo_trabajo == 'Trabaja, posible bajo rendimiento':
        factores_riesgo.append('Trabajo infantil')
    if rendimiento_alumno == 'Bajo':
        factores_riesgo.append('Bajo desempeño académico')
    
    # Contar factores de riesgo
    riesgo_contador = 0
    if motivo_asistencia in ['Bajo nivel de asistencia', 'Medio nivel de asistencia']:
        riesgo_contador += 1
    if motivo_presencia_padres in ['Sin padres', 'Tiene un solo padre/madre']:
        riesgo_contador += 1
    if motivo_trabajo == 'Trabaja, posible bajo rendimiento':
        riesgo_contador += 1
    
    Observaciones = predict.generar_observacion(motivo_asistencia, motivo_presencia_padres, motivo_trabajo, rendimiento_alumno).split(". ")
    
    resultado = ResultadoPrediccion(
        rendimiento=rendimiento_alumno,
        factores_riesgo=", ".join(factores_riesgo),
        observacion=Observaciones,
        estudiante_id=estudiante.id
    )
    # Verificar si ya existe un resultado para ese estudiante, curso y trimestre
    resultado_existente = db.query(ResultadoPrediccion).filter_by(
        estudiante_id=input.estudiante_id,
        curso=input.curso,
        trimestre=input.trimestre
    ).first()

    if resultado_existente:
        resultado_existente.rendimiento = rendimiento_alumno
        resultado_existente.factores_riesgo = ', '.join(factores_riesgo)
        resultado_existente.observacion = "\n".join(Observaciones)  
    else:
        nuevo_resultado = ResultadoPrediccion(
            estudiante_id=input.estudiante_id,
            curso=input.curso,
            trimestre=input.trimestre,
            rendimiento=rendimiento_alumno,
            factores_riesgo=', '.join(factores_riesgo),
            observacion="\n".join(Observaciones),
            #nuevo
            user_id = current_user.id
        )
        db.add(nuevo_resultado)
    db.commit()
    
    # Respuesta JSON
    return {
        
        "rendimiento": rendimiento_alumno,
        "motivo_asistencia": motivo_asistencia,
        "motivo_presencia_padres": motivo_presencia_padres,
        "motivo_trabajo": motivo_trabajo,
        "factores_riesgo": factores_riesgo,
        "Mensaje_riesgo": Observaciones,
    }

@router.get("/con_resultado", response_model=List[EstudianteConResultado])
def listar_estudiantes_con_resultado(db: Session = Depends(get_db)):
    return obtener_estudiantes_con_resultado(db)
    
@router.get("/reportes", response_model=List[ReporteAcademico])
def reportes_academicos(current_user: User = Depends(utils.get_current_user), db: Session = Depends(get_db), mes: int = Query(None), anio: int = Query(None)):
    reportes = obtener_reportes_academicos_por_docente(db, current_user.id, mes, anio)
    return reportes

@router.get("/reportes/riesgo", response_model=list[EstudianteRiesgoOut])
def obtener_estudiantes_en_riesgo(
    current_user: User = Depends(utils.get_current_user),
    db: Session = Depends(get_db),
    curso: str = Query(None),
    trimestre: int = Query(None)
):
    query = db.query(ResultadoPrediccion).join(Estudiante).outerjoin(RendimientoAcademico).filter(
        ResultadoPrediccion.rendimiento.in_(["Bajo", "Medio"]),
        Estudiante.docente_id == current_user.id
    )

    if curso:
        query = query.filter(ResultadoPrediccion.curso == curso)
    if trimestre:
        query = query.filter(ResultadoPrediccion.trimestre == trimestre)

    predicciones = query.all()

    estudiantes_riesgo = []

    for resultado in predicciones:
        estudiante = resultado.estudiante

        # 🔹 Consulta RendimientoAcademico por estudiante y trimestre
        rendimiento_academico = db.query(RendimientoAcademico).filter(
            RendimientoAcademico.estudiante_id == resultado.estudiante_id,
            RendimientoAcademico.trimestre == resultado.trimestre,
            RendimientoAcademico.curso == resultado.curso 
        ).first()


        nota_trimestre = rendimiento_academico.nota_trimestre if rendimiento_academico else None

        estudiantes_riesgo.append({
            "Codigo_estudiante": estudiante.Codigo_estudiante,
            "grado": estudiante.grado,
            "curso": resultado.curso,
            "trimestre": resultado.trimestre,
            "nota_trimestre": nota_trimestre,  # 🔹 Se obtiene correctamente la nota
            "causas_riesgo": [x.strip() for x in resultado.factores_riesgo.split(',') if x.strip()],
            "rendimiento": resultado.rendimiento
        })

    return estudiantes_riesgo
    
@router.get("/reportes/porcentaje-riesgo", response_model=list[dict])
def obtener_porcentaje_riesgo_por_curso(
    current_user: User = Depends(utils.get_current_user),
    db: Session = Depends(get_db),
    curso: str = Query(None),
    trimestre: int = Query(None)
):
    # Subconsulta: total de alumnos por curso del docente
    total_query = db.query(
            ResultadoPrediccion.curso,
            func.count(ResultadoPrediccion.id).label("total_alumnos")
        ).join(Estudiante).filter(
            Estudiante.docente_id == current_user.id
        )

    # Subconsulta: total en riesgo (rendimiento "Bajo")
    riesgo_query = db.query(
        ResultadoPrediccion.curso,
        func.count(ResultadoPrediccion.id).label("en_riesgo")
    ).join(Estudiante).filter(
        Estudiante.docente_id == current_user.id,
        ResultadoPrediccion.rendimiento.in_(["Bajo", "Medio"]),
    )

    if curso:
        total_query = total_query.filter(ResultadoPrediccion.curso == curso)
        riesgo_query = riesgo_query.filter(ResultadoPrediccion.curso == curso)
    if trimestre:
        total_query = total_query.filter(ResultadoPrediccion.trimestre == trimestre)
        riesgo_query = riesgo_query.filter(ResultadoPrediccion.trimestre == trimestre)

    total_query = total_query.group_by(ResultadoPrediccion.curso).all()
    riesgo_query = riesgo_query.group_by(ResultadoPrediccion.curso).all()

    # Convertir resultados en diccionarios para acceso fácil
    total_dict = {r.curso: r.total_alumnos for r in total_query}
    riesgo_dict = {r.curso: r.en_riesgo for r in riesgo_query}

    resultados = []
    for curso, total in total_dict.items():
        en_riesgo = riesgo_dict.get(curso, 0)
        porcentaje = round((en_riesgo / total) * 100, 2) if total > 0 else 0
        resultados.append({
            "curso": curso,
            "total_alumnos": total,
            "en_riesgo": en_riesgo,
            "porcentaje_riesgo": porcentaje
        })

    return resultados

@router.get("/reportes/promedio", response_model=list[dict])
def obtener_promedio_por_curso_trimestre(
    current_user: User = Depends(utils.get_current_user),
    db: Session = Depends(get_db),
    curso: str = Query(None),
    trimestre: int = Query(None)
):
    query = db.query(
        RendimientoAcademico.curso,
        RendimientoAcademico.trimestre,
        func.avg(RendimientoAcademico.nota_trimestre).label("promedio_nota")
    ).join(Estudiante).filter(
        Estudiante.docente_id == current_user.id
    )

    if curso:
        query = query.filter(RendimientoAcademico.curso == curso)
    if trimestre:
        query = query.filter(RendimientoAcademico.trimestre == trimestre)

    query = query.group_by(RendimientoAcademico.curso, RendimientoAcademico.trimestre).all()

    # Convertir resultados en diccionarios
    resultados = [
        {
            "curso": r.curso,
            "trimestre": r.trimestre,
            "promedio_nota": round(r.promedio_nota, 2) if r.promedio_nota else 0
        }
        for r in query
    ]

    return resultados
    
