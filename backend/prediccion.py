# prediccion.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import predict
from schemas import PrediccionInput
from database import get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
# importar tu modelo de base de datos y función get_db
from models import Estudiante, RendimientoAcademico, ResultadoPrediccion, User
from database import get_db
from crud import obtener_estudiantes_con_resultado
from typing import List
from schemas import EstudianteConResultado
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
    
    Observacion = ""
    if riesgo_contador >= 2:
        Observacion = "⚠️ Atención: Existen múltiples factores de riesgo que podrían afectar negativamente el rendimiento."
    else:
        Observacion = "Ninguna observación según los parámetros actuales."
    
    resultado = ResultadoPrediccion(
        rendimiento=rendimiento_alumno,
        factores_riesgo=", ".join(factores_riesgo),
        observacion=Observacion,
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
        resultado_existente.observacion = Observacion
    else:
        nuevo_resultado = ResultadoPrediccion(
            estudiante_id=input.estudiante_id,
            curso=input.curso,
            trimestre=input.trimestre,
            rendimiento=rendimiento_alumno,
            factores_riesgo=', '.join(factores_riesgo),
            observacion=Observacion,
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
        "Mensaje_riesgo": Observacion,
    }

@router.get("/con_resultado", response_model=List[EstudianteConResultado])
def listar_estudiantes_con_resultado(db: Session = Depends(get_db)):
    return obtener_estudiantes_con_resultado(db)
    


    
    
