from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

URL_DATABASE = (
    "mysql+pymysql://Api_DB:Database_tesis123"
    "@database-tesis.mysql.database.azure.com:3306/api_db?charset=utf8mb4"
)

SSL_CERT_PATH = "/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt.pem"  # Ruta en Azure

ssl_args = {
    "ssl": {
        "ca": SSL_CERT_PATH
    }
}

engine = create_engine(URL_DATABASE, connect_args=ssl_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

