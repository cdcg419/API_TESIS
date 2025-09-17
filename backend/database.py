import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

URL_DATABASE = os.getenv("AZURE_MYSQL_URL")

SSL_CERT_PATH = os.getenv("SSL_CERT_PATH")

ssl_args = {"ssl": {"ca": SSL_CERT_PATH}} if SSL_CERT_PATH else {}

engine = create_engine(URL_DATABASE, connect_args=ssl_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

