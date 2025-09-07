#auth.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, crud
from utils import create_access_token
from utils import hash_password, verify_password, get_current_user
from fastapi import Form
from utils import generar_contraseña_temporal, enviar_correo, hash_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.correo == user.correo).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    hashed_pass = hash_password(user.contraseña)
    new_user = models.User(
        nombre=user.nombre,
        apellido=user.apellido,
        correo=user.correo,
        contraseña=hashed_pass
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.correo == user.correo).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(user.contraseña, db_user.contraseña):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    token_data = {
        "sub": db_user.correo
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "nombre": db_user.nombre,
            "apellido": db_user.apellido,
            "correo": db_user.correo,
            "requiere_cambio": db_user.requiere_cambio 
        }
    }

@router.post("/logout")
def logout(usuario: schemas.UserOut = Depends(get_current_user)):
    return {"mensaje": f"Sesión cerrada correctamente para {usuario.correo}"}


@router.post("/recuperar")
def recuperar_contraseña(correo: str = Form(...), db: Session = Depends(get_db)):
    usuario = db.query(models.User).filter(models.User.correo == correo).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Correo no registrado")

    # Generar nueva contraseña temporal
    nueva_clave = generar_contraseña_temporal()

    # Hashearla y actualizar en la base de datos
    usuario.contraseña = hash_password(nueva_clave)
    usuario.requiere_cambio = True
    db.commit()

    # Preparar cuerpo del correo
    cuerpo = f"""
        Hola {usuario.nombre},

        Tu nueva contraseña temporal es: {nueva_clave}

        Por seguridad, deberás cambiarla al ingresar.

        Si no solicitaste este cambio, puedes ignorar este mensaje.

        Saludos,
        El equipo de soporte
        """

    # Enviar correo
    enviar_correo(destinatario=correo, asunto="Recuperación de contraseña", cuerpo=cuerpo)

    return {"mensaje": "Se ha enviado una contraseña temporal al correo"}