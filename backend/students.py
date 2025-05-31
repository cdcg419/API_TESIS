#students.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import models
import schemas
import crud
from database import get_db 
from utils import get_current_user

router = APIRouter()

router = APIRouter(
    prefix="/estudiantes",
    tags=["Estudiantes"]
)

@router.post("/", response_model=schemas.Estudiante)
def crear_estudiante(
    student: schemas.EstudianteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # usuario actual
):
    # Asignar el docente_id al estudiante
    return crud.crear_estudiante(db=db, student=student, docente_id=current_user.id)

@router.get("/", response_model=list[schemas.Estudiante])
def listar_estudiantes(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return crud.obtener_estudiantes(db)

@router.get("/{estudiante_id}", response_model=schemas.Estudiante)
def obtener_estudiante(estudiante_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    estudiante = crud.obtener_estudiante(db, estudiante_id)
    if estudiante is None:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return estudiante

@router.put("/{estudiante_id}", response_model=schemas.Estudiante)
def actualizar_estudiante(estudiante_id: int, estudiante: schemas.EstudianteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verificar que el estudiante le pertenezca al docente autenticado
    estudiante_actual = crud.obtener_estudiante_por_id_y_docente(db, estudiante_id, current_user.id)
    if estudiante_actual is None:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este estudiante")
    
    estudiante_actualizado = crud.actualizar_estudiante(db, estudiante_id, estudiante)
    return estudiante_actualizado

@router.delete("/{estudiante_id}", response_model=schemas.Estudiante)
def eliminar_estudiante(estudiante_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verificar que el estudiante le pertenezca al docente autenticado
    estudiante_actual = crud.obtener_estudiante_por_id_y_docente(db, estudiante_id, current_user.id)
    if estudiante_actual is None:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este estudiante")
    
    estudiante_eliminado = crud.eliminar_estudiante(db, estudiante_id)
    return estudiante_eliminado
