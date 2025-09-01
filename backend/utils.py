#utils.py
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt, ExpiredSignatureError
import models
from database import get_db
from passlib.context import CryptContext
import secrets

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Configuración de JWT
SECRET_KEY = "missecretoseguro"  # Cambia esto por una clave segura
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180  # Tiempo de expiración del token

# Configuración de PassLib para el hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Función para cifrar la contraseña
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Función para verificar la contraseña
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Función para autenticar al usuario (Login)
def authenticate_user(db: Session, correo: str, contraseña: str):
    user = db.query(models.User).filter(models.User.correo == correo).first()
    if user is None or not verify_password(contraseña, user.contraseña):  # Usamos verify_password
        return False
    return user

# Función para crear un token de acceso
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Función para obtener el usuario actual desde el token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, "missecretoseguro", algorithms=["HS256"])  # Cambia SECRET_KEY por tu clave secreta
        user_correo: str = payload.get("sub")
        if user_correo is None:
            raise credentials_exception
        user = db.query(models.User).filter(models.User.correo == user_correo).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception


def generar_contraseña_temporal() -> str:
    return secrets.token_urlsafe(8)  # Ejemplo: 'X9kLp2qZ'

def enviar_correo(destinatario: str, asunto: str, cuerpo: str):
    remitente = "predix20@gmail.com"  # 👈 Cambia esto por tu correo real
    contraseña = "bipz bqgx wvll ftwu"  # 👈 Usa una contraseña de aplicación (no la normal)

    mensaje = MIMEMultipart()
    mensaje["From"] = remitente
    mensaje["To"] = destinatario
    mensaje["Subject"] = asunto

    mensaje.attach(MIMEText(cuerpo, "plain"))

    try:
        servidor = smtplib.SMTP("smtp.gmail.com", 587)
        servidor.starttls()
        servidor.login(remitente, contraseña)
        servidor.sendmail(remitente, destinatario, mensaje.as_string())
        servidor.quit()
        print("✅ Correo enviado correctamente")
    except Exception as e:
        print(f"❌ Error al enviar el correo: {e}")
