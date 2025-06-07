# users.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas, crud
from utils import verify_password
import models
from utils import get_current_user

router = APIRouter(prefix="/api/auth", tags=["users"])

@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.put("/update/{user_id}")
def update_user(user_id: int, user: schemas.UpdateUser, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    updated_user = crud.update_user(db, user_id, user)
    return updated_user

@router.put("/update_password")
def update_password(data: schemas.PasswordUpdate, db: Session = Depends(get_db)):
    user = crud.get_user_by_id(db, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Si decides usar verificación de contraseña anterior, descomenta esta parte:
    # if not verify_password(data.old_password, user.contraseña):
    #     raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")

    updated_user = crud.update_user_password(db, data.user_id, data.new_password)
    return {"message": "Contraseña actualizada correctamente"}


@router.delete("/delete/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Llamar a la función que elimina el usuario en la base de datos
    crud.delete_user(db, user_id)
    return {"message": "Usuario eliminado exitosamente"}

@router.get("/docente/predicciones", response_model=list[schemas.ResultadoPrediccionOut])
def obtener_predicciones_docente(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.obtener_predicciones_por_docente(db, current_user.id)