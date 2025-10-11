from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Dapatkan direktori saat ini
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# SQLite database - file akan dibuat di folder backend
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'physicslab.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()