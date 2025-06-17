from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, RendimientoAcademico, Estudiante, ResultadoPrediccion
from sqlalchemy import func, Integer
import utils

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/cursos_asignados", response_model=int)
def obtener_total_cursos_asignados(
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    total_cursos = db.query(func.count(func.distinct(RendimientoAcademico.curso))).filter(
        RendimientoAcademico.estudiante_id.in_(
            db.query(Estudiante.id).filter(Estudiante.docente_id == current_user.id)
        )
    ).scalar()

    return total_cursos

@router.get("/total_estudiantes", response_model=int)
def obtener_total_estudiantes(
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    total_estudiantes = db.query(func.count(Estudiante.id)).filter(
        Estudiante.docente_id == current_user.id
    ).scalar()

    return total_estudiantes

@router.get("/genero_estudiantes")
def obtener_distribucion_genero(
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    total_hombres = db.query(func.count(Estudiante.id)).filter(
        Estudiante.docente_id == current_user.id,
        Estudiante.genero == "M"
    ).scalar()

    total_mujeres = db.query(func.count(Estudiante.id)).filter(
        Estudiante.docente_id == current_user.id,
        Estudiante.genero == "F"
    ).scalar()

    total = total_hombres + total_mujeres

    return {
        "hombres": round((total_hombres / total) * 100, 2) if total > 0 else 0,
        "mujeres": round((total_mujeres / total) * 100, 2) if total > 0 else 0
    }
    
@router.get("/estudiantes_trabajan")
def obtener_estudiantes_trabajan_por_grado(
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    resultado = db.query(
        Estudiante.grado,
        func.count(Estudiante.id).label("total"),
        func.sum(Estudiante.trabaja.cast(Integer)).label("trabajan")
    ).filter(
        Estudiante.docente_id == current_user.id
    ).group_by(Estudiante.grado).all()

    datos = [
        {
            "grado": r.grado,
            "porcentaje": round((r.trabajan / r.total) * 100, 2) if r.total > 0 else 0
        }
        for r in resultado
    ]

    return datos

@router.get("/rendimiento_bajo")
def obtener_rendimiento_bajo(
    trimestre: int,
    grado: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    resultado = db.query(
        RendimientoAcademico.curso,
        func.count(RendimientoAcademico.id).label("total"),
        func.sum((RendimientoAcademico.nota_trimestre < 12).cast(Integer)).label("bajo_rendimiento")
    ).join(Estudiante, RendimientoAcademico.estudiante_id == Estudiante.id).filter(
        Estudiante.docente_id == current_user.id,
        Estudiante.grado == grado,
        RendimientoAcademico.trimestre == trimestre
    ).group_by(RendimientoAcademico.curso).order_by(
        func.sum((RendimientoAcademico.nota_trimestre < 12).cast(Integer)).desc()
    ).all()

    datos = [
        {
            "curso": r.curso,
            "porcentaje": round((r.bajo_rendimiento / r.total) * 100, 2) if r.total > 0 else 0
        }
        for r in resultado
    ]

    return datos

@router.get("/estudiantes_bajo_rendimiento")
def obtener_estudiantes_bajo_rendimiento(
    trimestre: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(utils.get_current_user)
):
    resultado = db.query(
        Estudiante.Codigo_estudiante,
        Estudiante.grado,
        ResultadoPrediccion.curso,
        ResultadoPrediccion.trimestre,  # Agregamos el trimestre
        ResultadoPrediccion.rendimiento.label("nivel_intervencion")
    ).join(ResultadoPrediccion).filter(
        Estudiante.id == ResultadoPrediccion.estudiante_id,
        Estudiante.docente_id == current_user.id,
        ResultadoPrediccion.rendimiento == "Bajo",
        ResultadoPrediccion.trimestre == trimestre  # Filtrar por trimestre seleccionado
    ).all()

    datos = [
        {
            "nombre": r.Codigo_estudiante,
            "grado": r.grado,
            "curso": r.curso,
            "trimestre": r.trimestre,
            "nivel_intervencion": "Reforzar"
        }
        for r in resultado
    ]

    return datos