#students.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import models
import schemas
import crud
from database import get_db 
from utils import get_current_user

router = APIRouter()

