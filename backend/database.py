from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite database file will be created in the backend folder
DATABASE_URL = "sqlite:///./support.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency - used in every route to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
