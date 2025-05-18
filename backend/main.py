#main.py
from fastapi import FastAPI
from database import Base, engine
import models
from auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from users import router as users_router
from students import router as estudiantes_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

models.Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(users_router)
app.include_router(estudiantes_router)
