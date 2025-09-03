#registro-notas.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import schemas, models, crud
from typing import List

from utils import get_current_user

router = APIRouter(
    prefix="/registro-academico",
    tags=["Registro Académico"]
)

@router.post("/", response_model=schemas.RendimientoAcademicoOut)
def registrar_academico(registro: schemas.RendimientoAcademicoCreate, db: Session = Depends(get_db)):
    return crud.crear_registro_academico(db, registro)

#nuevo endpoint:
@router.get("/estudiantes-docente/{docente_id}", response_model=List[schemas.EstudianteInfo])
def obtener_estudiantes_docente(docente_id: int, db: Session = Depends(get_db)):
    estudiantes = db.query(models.Estudiante).filter(models.Estudiante.docente_id == docente_id).all()
    return estudiantes

#nuevo endpoint:
@router.get("/estudiante/{estudiante_id}/docente/{docente_id}", response_model=List[schemas.RendimientoAcademicoOut])
def obtener_registros_por_estudiante_y_docente(estudiante_id: int, docente_id: int, db: Session = Depends(get_db)):
    estudiante = db.query(models.Estudiante).filter(
        models.Estudiante.id == estudiante_id,
        models.Estudiante.docente_id == docente_id
    ).first()

    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado o no pertenece al docente")

    registros = crud.obtener_registros_por_estudiante(db, estudiante_id)
    return registros

@router.get("/estudiante/{estudiante_id}", response_model=list[schemas.RendimientoAcademicoOut])
def obtener_registros(estudiante_id: int, db: Session = Depends(get_db)):
    registros = crud.obtener_registros_por_estudiante(db, estudiante_id)
    if not registros:
        raise HTTPException(status_code=404, detail="No se encontraron registros")
    return registros

@router.get("/estudiantes", response_model=list[schemas.EstudianteInfo])
def listar_estudiantes(db: Session = Depends(get_db)):
    return db.query(models.Estudiante).all()

#editar y eliminar
@router.put("/{registro_id}", response_model=schemas.RendimientoAcademicoOut)
def actualizar_registro_academico(
    registro_id: int,
    registro_data: schemas.RendimientoAcademicoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.actualizar_registro_academico(db, registro_id, registro_data, current_user)

@router.delete("/{registro_id}")
def eliminar_registro_academico(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # ← agregar esto
):
    crud.eliminar_registro_academico(db, registro_id, current_user)
    return {"mensaje": "Registro eliminado exitosamente"}

#nuevo
@router.get("/registro-academico/{id}", response_model=schemas.RendimientoAcademicoOut)
def obtener_registro_academico(id: int, db: Session = Depends(get_db)):
    registro = crud.obtener_registro_por_id(db, id)  # Llamada al crud
    if not registro:
        raise HTTPException(status_code=404, detail="Registro académico no encontrado")
    return registro