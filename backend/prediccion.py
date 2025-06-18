# prediccion.py
from fastapi import APIRouter, HTTPException, status, Depends, Query
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
from schemas import EstudianteConResultado, ReporteAcademico, EstudianteRiesgoOut, HistorialPrediccionResponse, RankingEstudiantesResponse
from crud import obtener_reportes_academicos_por_docente, obtener_ranking_por_trimestre
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
def predecir_rendimiento(input: PrediccionInput, db: Session = Depends(get_db), current_user: User = Depends(utils.get_current_user)):

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
        'motivo_asistencia': 0,
        'motivo_presencia_padres': 0,
        'motivo_trabajo': 0,
    }])

    # Predecir motivos usando funciones y mapas
    rendimiento_text = 'Medio'  # Se puede ajustar
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

    # 🔹 Obtener notas actualizadas y verificar si hay datos correctos
    rendimientos = db.query(RendimientoAcademico).filter(
        RendimientoAcademico.estudiante_id == input.estudiante_id,
        RendimientoAcademico.curso == input.curso  # 🔹 Filtra por el curso correcto
    ).order_by(RendimientoAcademico.trimestre).all()

    notas = [r.nota_trimestre for r in rendimientos]
    # 🔹 Calcular notas necesarias para mejorar o mantener el rendimiento
    rendimiento_actual = predict.proyectar_nota_anual(notas)
    
    # 🔹 Calcular notas necesarias para mejorar o mantener el rendimiento (sin llamar función externa)
    if input.trimestre == 1:
        nota_requerida_medio = round(((12 * 2) - notas[0]), 1) if len(notas) >= 1 else 12
        nota_requerida_alto = round(((17 * 2) - notas[0]), 1) if len(notas) >= 1 else 17

    elif input.trimestre == 2:
        nota_requerida_medio = round(((12 * 3) - sum(notas[:2])) / (3 - len(notas[:2])), 1) if len(notas) >= 2 else 12
        nota_requerida_medio = max(nota_requerida_medio, 6)  # 🔹 Aseguramos un mínimo razonable
        nota_requerida_alto = round(((17 * 3) - sum(notas[:2])) / (3 - len(notas[:2])), 1) if len(notas) >= 2 else 17

    elif input.trimestre == 3:
        nota_requerida_medio = 12  # 🔹 Valor estándar si ya está en el tercer trimestre
        nota_requerida_alto = 17

    # 🔹 Evitamos valores imposibles
    nota_requerida_medio = max(nota_requerida_medio, 6)  # Nunca debe ser menor a 6
    nota_requerida_alto = max(nota_requerida_alto, 17) if nota_requerida_alto <= 20 else "**Esfuerzo adicional necesario para alcanzar 'Alto'**"

    # 🔹 Depuración para verificar cálculos antes de aplicar al mensaje umbral
    #print(f"✅ Notas actuales: {notas}")
    #print(f"📌 Nota requerida para 'Medio': {nota_requerida_medio}")
    #print(f"📌 Nota requerida para 'Alto': {nota_requerida_alto}")
    
    # 🔹 Evaluar primero el trimestre para evitar que los casos anteriores lo bloqueen
    # Ajustar mensaje umbral correctamente
    if input.trimestre == 3:
        mensaje_umbral = f"En base a los datos de los tres trimestres en {input.curso}, el resultado final del año es '{rendimiento_actual}'."

    elif rendimiento_alumno == "Bajo":
        mensaje_umbral = f"En base a los datos del primer trimestre en {input.curso}, se recomienda que para el segundo trimestre el estudiante obtenga al menos {nota_requerida_medio} para subir su rendimiento a 'Medio'."

    elif rendimiento_alumno == "Medio":
        if input.trimestre == 1:
            mensaje_umbral = f"En base a los datos del primer trimestre en {input.curso}, se recomienda que para el segundo trimestre el estudiante obtenga al menos {nota_requerida_medio} para mantenerse en 'Medio'."
        elif input.trimestre == 2:
            mensaje_umbral = f"En base a los datos del segundo trimestre en {input.curso}, se recomienda que para el tercer trimestre el estudiante obtenga al menos {nota_requerida_medio} para mantenerse en 'Medio'."

        try:
            if float(nota_requerida_alto) > 20:
                mensaje_umbral += " y será necesario un esfuerzo adicional para alcanzar 'Alto'."
            else:
                mensaje_umbral += f" y más de {nota_requerida_alto} para alcanzar 'Alto'."
        except ValueError:
            mensaje_umbral += " y será necesario un esfuerzo adicional para alcanzar 'Alto'."

    elif rendimiento_alumno == "Alto":
        if notas[0] > 20:
            mensaje_umbral = f"Para mantenerse en 'Alto' en {input.curso}, el estudiante debe obtener una nota incluso superior a 20."
        else:
            try:
                if float(nota_requerida_alto) > 20:
                    mensaje_umbral = f"Para mantenerse en 'Alto' en {input.curso}, será necesario un esfuerzo adicional."
                else:
                    mensaje_umbral = f"Para mantenerse en 'Alto' en {input.curso}, el estudiante debe obtener al menos {nota_requerida_alto}."
            except ValueError:
                mensaje_umbral = f"Para mantenerse en 'Alto' en {input.curso}, será necesario un esfuerzo adicional."

    else:
        mensaje_umbral = f"No hay suficientes datos en {input.curso} para calcular una recomendación."

    # Contar factores de riesgo
    riesgo_contador = 0
    if motivo_asistencia in ['Bajo nivel de asistencia', 'Medio nivel de asistencia']:
        riesgo_contador += 1
    if motivo_presencia_padres in ['Sin padres', 'Tiene un solo padre/madre']:
        riesgo_contador += 1
    if motivo_trabajo == 'Trabaja, posible bajo rendimiento':
        riesgo_contador += 1

    Observaciones = predict.generar_observacion(motivo_asistencia, motivo_presencia_padres, motivo_trabajo, rendimiento_alumno).split(". ")

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
        resultado_existente.mensaje_umbral = mensaje_umbral  # 🔹 Guardamos mensaje umbral

        db.commit()
        db.refresh(resultado_existente)  # 🔹 Forzar actualización en la base de datos

    else:
        nuevo_resultado = ResultadoPrediccion(
            estudiante_id=input.estudiante_id,
            curso=input.curso,
            trimestre=input.trimestre,
            rendimiento=rendimiento_alumno,
            factores_riesgo=', '.join(factores_riesgo),
            observacion="\n".join(Observaciones),
            mensaje_umbral=mensaje_umbral,  # 🔹 Guardamos mensaje umbral
            user_id=current_user.id
        )
        db.add(nuevo_resultado)
        db.commit()
        db.refresh(nuevo_resultado) 
    
    # Respuesta JSON
    return {
        "rendimiento": rendimiento_alumno,
        "motivo_asistencia": motivo_asistencia,
        "motivo_presencia_padres": motivo_presencia_padres,
        "motivo_trabajo": motivo_trabajo,
        "factores_riesgo": factores_riesgo,
        "Mensaje_riesgo": Observaciones,
        "mensaje_umbral": mensaje_umbral  # 🔹 Retornamos el mensaje umbral
    }


@router.get("/con_resultado", response_model=List[EstudianteConResultado])
def listar_estudiantes_con_resultado(db: Session = Depends(get_db)):
    return obtener_estudiantes_con_resultado(db)
    
@router.get("/reportes", response_model=List[ReporteAcademico])
def reportes_academicos(current_user: User = Depends(utils.get_current_user), db: Session = Depends(get_db), mes: int = Query(None), anio: int = Query(None), grado: int = Query(None)):
    reportes = obtener_reportes_academicos_por_docente(db, current_user.id, mes, anio, grado)
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
            "rendimiento": resultado.rendimiento,
            "mensaje_umbral": resultado.mensaje_umbral
        })

    return estudiantes_riesgo
    
@router.get("/reportes/porcentaje-riesgo", response_model=list[dict])
def obtener_porcentaje_riesgo_por_curso(
    current_user: User = Depends(utils.get_current_user),
    db: Session = Depends(get_db),
    curso: str = Query(None),
    trimestre: int = Query(None),
    grado: int = Query(None)
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
    if grado:
        total_query = total_query.filter(Estudiante.grado == grado)
        riesgo_query = riesgo_query.filter(Estudiante.grado == grado)

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

@router.get("/historial")
def obtener_historial_estudiantes(
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    registros = (
        db.query(Estudiante.id ,Estudiante.Codigo_estudiante, Estudiante.grado, RendimientoAcademico, ResultadoPrediccion)
        .join(RendimientoAcademico, Estudiante.id == RendimientoAcademico.estudiante_id)
        .join(ResultadoPrediccion,
            (RendimientoAcademico.estudiante_id == ResultadoPrediccion.estudiante_id) &
            (RendimientoAcademico.curso == ResultadoPrediccion.curso) &
            (RendimientoAcademico.trimestre == ResultadoPrediccion.trimestre))
        .filter(Estudiante.docente_id == current_user.id)
        .order_by(ResultadoPrediccion.fecha_registro.desc())
        .all()
    )

    resultado = []
    for estudiante_id, Codigo_estudiante, grado, rendimiento, prediccion in registros:
        resultado.append(HistorialPrediccionResponse(
            estudiante_id=estudiante_id,
            Codigo_estudiante=Codigo_estudiante,
            grado=grado,
            curso=rendimiento.curso,
            trimestre=rendimiento.trimestre,
            nota=rendimiento.nota_trimestre,
            asistencia=rendimiento.asistencia,
            conducta=rendimiento.conducta,
            rendimiento=prediccion.rendimiento,
            fecha_prediccion=prediccion.fecha_registro,
            observacion=prediccion.observacion,  # ← Se extrae la observación
            mensaje_umbral=prediccion.mensaje_umbral
        ))

    return resultado

############

@router.get("/reportes/ranking", response_model=RankingEstudiantesResponse)
def ranking_estudiantes(
    trimestre: int,
    grado: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    estudiantes = obtener_ranking_por_trimestre(db, current_user.id, trimestre, grado)
    return {
        "trimestre": trimestre,
        "estudiantes": estudiantes
    }






##Extendidas de prueba
@router.get("/proyeccion_anual_extended")
def proyeccion_rendimiento_final_extended(estudiante_id: int, curso: str, db: Session = Depends(get_db)):
    # Obtener registros de rendimiento académico
    registros = db.query(RendimientoAcademico).filter_by(estudiante_id=estudiante_id, curso=curso).order_by(RendimientoAcademico.trimestre.asc()).all()

    if not registros:
        raise HTTPException(status_code=404, detail="No se encontraron registros académicos para este estudiante y curso.")

    # Extraer lista de rendimientos categóricos
    rendimientos = [predict.categorize_grades(registro.nota_trimestre) for registro in registros]

    # ⚠️ Si hay menos de dos trimestres, no proyectamos
    if len(rendimientos) < 2:
        return {
            "Codigo_estudiante": registros[0].estudiante.Codigo_estudiante,
            "curso": curso,
            "rendimientos_trimestrales": rendimientos,
            "mensaje": "No se puede proyectar el rendimiento anual con solo un trimestre registrado."
        }

    # Si ya hay T3, usar la proyección normal
    if len(rendimientos) == 3:
        rendimiento_anual = predict.proyectar_rendimiento_anual(rendimientos)
        return {
            "Codigo_estudiante": registros[0].estudiante.Codigo_estudiante,
            "curso": curso,
            "rendimientos_trimestrales": rendimientos,
            "proyeccion_final_anual": rendimiento_anual
        }

    # Si aún no hay T3, generar simulaciones con diferentes escenarios
    escenarios = {"Bajo": None, "Medio": None, "Alto": None}
    
    for t3_simulado in escenarios.keys():
        escenarios[t3_simulado] = predict.proyectar_rendimiento_anual(rendimientos + [t3_simulado])

    return {
        "Codigo_estudiante": registros[0].estudiante.Codigo_estudiante,
        "curso": curso,
        "rendimientos_trimestrales": rendimientos,
        "proyeccion_final_simulada": escenarios
    }

@router.get("/proyeccion_nota_extended")
def proyeccion_nota_final_extended(estudiante_id: int, curso: str, db: Session = Depends(get_db)):
    registros = db.query(RendimientoAcademico).filter_by(estudiante_id=estudiante_id, curso=curso).order_by(RendimientoAcademico.trimestre.asc()).all()

    if not registros:
        raise HTTPException(status_code=404, detail="No se encontraron registros académicos para este estudiante y curso.")

    notas = [registro.nota_trimestre for registro in registros]

    if len(notas) < 1:
        return {"mensaje": "No hay suficiente información para realizar una proyección."}

    respuesta = {
        "Codigo_estudiante": registros[0].estudiante.Codigo_estudiante,
        "curso": curso,
        "notas_trimestrales": notas
    }

    # Simulación de posibles notas en T2 y T3
    escenarios_t2 = {"T2 = 10": None, "T2 = 14": None, "T2 = 18": None}
    escenarios_t3 = {"T3 = 10": None, "T3 = 14": None, "T3 = 18": None}

    # 🔹 Si hay solo un trimestre, simulamos T2 pero NO T3
    if len(notas) == 1:
        for t2_simulado in [10, 14, 18]:  
            escenarios_t2[f"T2 = {t2_simulado}"] = predict.proyectar_nota_anual(notas + [t2_simulado])

        respuesta["proyeccion_trimestre_2_simulada"] = escenarios_t2

    # 🔹 Si hay dos trimestres, simulamos T3
    if len(notas) == 2:
        for t3_simulado in [10, 14, 18]:  
            escenarios_t3[f"T3 = {t3_simulado}"] = predict.proyectar_nota_anual(notas + [t3_simulado])

        respuesta["proyeccion_trimestre_3_simulada"] = escenarios_t3

    # Si ya hay T3, proyectamos el resultado final anual
    if len(notas) == 3:
        respuesta["proyeccion_final_anual"] = predict.proyectar_nota_anual(notas)

    return respuesta

@router.get("/recomendacion_umbral")
def recomendacion_umbral_rendimiento(estudiante_id: int, curso: str, db: Session = Depends(get_db)):
    registros = db.query(RendimientoAcademico).filter_by(estudiante_id=estudiante_id, curso=curso).order_by(RendimientoAcademico.trimestre.asc()).all()

    if not registros:
        raise HTTPException(status_code=404, detail="No se encontraron registros académicos para este estudiante y curso.")

    notas = [registro.nota_trimestre for registro in registros]

    respuesta = {
        "Codigo_estudiante": registros[0].estudiante.Codigo_estudiante,
        "curso": curso,
        "notas_trimestrales": notas
    }

    if len(notas) == 1:
        nota_requerida_t2 = predict.calcular_umbral_proximo_trimestre(notas)
        rendimiento_actual = predict.proyectar_nota_anual(notas)
        respuesta["mensaje_umbral"] = f"En base a los datos del primer trimestre, se recomienda que para el segundo trimestre el estudiante obtenga al menos {nota_requerida_t2} para mantener su rendimiento '{rendimiento_actual}'."
    
    if len(notas) == 2:
        nota_requerida_t3 = predict.calcular_umbral_proximo_trimestre(notas)
        rendimiento_actual = predict.proyectar_nota_anual(notas)
        respuesta["mensaje_umbral"] = f"En base a los datos del segundo trimestre, se recomienda que para el tercer trimestre el estudiante obtenga al menos {nota_requerida_t3} para mantener su rendimiento '{rendimiento_actual}'."
    
    if len(notas) == 3:
        rendimiento_actual = predict.proyectar_nota_anual(notas)
        respuesta["mensaje_umbral"] = f"En base a los datos de los tres trimestres, el resultado final del año es '{rendimiento_actual}'."

    return respuesta