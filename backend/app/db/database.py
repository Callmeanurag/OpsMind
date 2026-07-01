import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Defaults to SQLite for local development — no PostgreSQL setup needed out of the box.
# Set DATABASE_URL in your environment to switch to PostgreSQL.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./opsmind.db")

# check_same_thread is a SQLite-only requirement; it is ignored by PostgreSQL
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    Dependency used in route handlers via FastAPI's Depends().
    Yields a database session and always closes it after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
