from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.routes import incidents, search, ai

# Create all tables on startup if they do not already exist.
# Acceptable for a learning project; use Alembic migrations in production.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OpsMind API",
    description="AI-Assisted Incident Intelligence Platform",
    version="1.0.0",
)

# Allow all origins during development.
# In production, replace "*" with the actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
