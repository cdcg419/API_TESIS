# predict.py
from sqlalchemy.orm import Session
import joblib
import os
import numpy as np
import joblib


# Ruta al modelo entrenado
MODEL_PATH = os.path.join("ml_model", "modelo_rendimiento.pkl")

# Cargar el modelo al iniciar el archivo
try:
    rf_model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"No se pudo cargar el modelo desde {MODEL_PATH}: {e}")

# Mapas de categorías (asegúrate que coincidan con los de tu entrenamiento)
categoria_map = {'Bajo': 0, 'Medio': 1, 'Alto': 2}
genero_map = {'M': 0, 'F': 1}
presencia_padres_map = {'Ninguno': 0, 'Solo padre': 1, 'Solo madre': 2, 'Ambos': 3}
trabaja_map = {False: 0, True: 1}
motivo_map = {
    'Bajo nivel de asistencia': 0, 'Medio nivel de asistencia': 1, 'Buen nivel de asistencia': 2,
    'No es necesario debido a que tiene Alto rendimiento': 3,
    'Sin padres': 0, 'Tiene un solo padre/madre': 1, 'Ambos padres presentes': 2,
    'Trabaja, posible bajo rendimiento': 0, 'No trabaja': 1
}

# Funciones categorizar y predecir motivos, copia las que tengas en Colab
def categorize_assistance(x):
    if x < 70:
        return 'Bajo'
    elif 70 <= x <= 90:
        return 'Medio'
    else:
        return 'Alto'

def categorize_grades(x):
    if x <= 11:
        return 'Bajo'
    elif 12 <= x <= 16:
        return 'Medio'
    else:
        return 'Alto'

def categorize_conduct(x):
    if x <= 11:
        return 'Bajo'
    elif 12 <= x <= 16:
        return 'Medio'
    else:
        return 'Alto'

def predecir_motivo_asistencia(asistencia, rendimiento):
    if rendimiento != 'Alto':
        if asistencia < 70:
            return 'Bajo nivel de asistencia'
        elif 70 <= asistencia <= 90:
            return 'Medio nivel de asistencia'
        else:
            return 'Buen nivel de asistencia'
    else:
        return 'No es necesario debido a que tiene Alto rendimiento'

def predecir_motivo_presencia_padres(presencia, rendimiento):
    if rendimiento != 'Alto':
        if presencia == 0:
            return 'Sin padres'
        elif presencia in [1, 2]:
            return 'Tiene un solo padre/madre'
        else:
            return 'Ambos padres presentes'
    else:
        return 'No es necesario debido a que tiene Alto rendimiento'

def predecir_motivo_trabajo(trabaja, rendimiento):
    if rendimiento != 'Alto':
        if trabaja == True:
            return 'Trabaja, posible bajo rendimiento'
        else:
            return 'No trabaja'
    else:
        return 'No es necesario debido a que tiene Alto rendimiento'

def generar_observacion(motivo_asistencia, motivo_presencia_padres, motivo_trabajo, rendimiento):
    observacion = []

    # Validar que rendimiento tenga un valor esperado
    if rendimiento not in ["Bajo", "Medio", "Alto"]:
        return "⚠️ Error: Valor de rendimiento no reconocido."

    # Nivel bajo
    if rendimiento == "Bajo":
        if motivo_asistencia == "Bajo nivel de asistencia":
            observacion.append("📉 Baja asistencia afecta el rendimiento académico.")
        if motivo_presencia_padres == "Sin padres":
            observacion.append("🏠 Falta de apoyo familiar podría impactar la concentración.")
        if motivo_trabajo == "Trabaja, posible bajo rendimiento":
            observacion.append("💼 Trabajo infantil puede reducir tiempo de estudio.")

    # Nivel medio
    if rendimiento == "Medio":
        if motivo_asistencia == "Medio nivel de asistencia":
            observacion.append("📊 Asistencia irregular podría generar dificultades en el aprendizaje.")
        if motivo_presencia_padres == "Presencia parental parcial":
            observacion.append("👨‍👩‍👦 Supervisión familiar moderada podría afectar el seguimiento académico.")
        if motivo_trabajo == "Trabaja, posible bajo rendimiento":
            observacion.append("⏳ Trabajo ocasional puede disminuir el tiempo de estudio.")

    # Nivel alto
    if rendimiento == "Alto":
        observacion.append("⚠️ Aunque el rendimiento es alto, ciertos factores podrían afectar su estabilidad a largo plazo.")
        if motivo_asistencia in ["Bajo nivel de asistencia", "Medio nivel de asistencia"]:
            observacion.append("📉 Es importante mantener una asistencia constante para evitar impactos en el aprendizaje.")
        if motivo_presencia_padres == "Presencia parental parcial":
            observacion.append("👨‍👩‍👦 Asegurar un mejor apoyo familiar podría mejorar aún más el rendimiento.")
        if motivo_trabajo in ["Trabaja ocasionalmente", "Trabaja, posible bajo rendimiento"]:
            observacion.append("💼 Balancear trabajo y estudio es clave para mantener el alto desempeño.")

    return " ".join(observacion) if observacion else "✅ Sin riesgos significativos."
