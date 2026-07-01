import os

from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.models.incident import Incident

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./opsmind.db")


def search_incidents(db: Session, query: str) -> list[Incident]:
    """
    Searches incidents by keyword.
    - PostgreSQL: uses native full-text search via tsvector / plainto_tsquery
    - SQLite (local dev): falls back to a simple case-insensitive LIKE query
    Phase 2 upgrade path: replace _pg_fulltext_search with pgvector embeddings
    for semantic / meaning-based search — same PostgreSQL database, no new service.
    """
    if DATABASE_URL.startswith("postgresql"):
        return _pg_fulltext_search(db, query)
    return _like_search(db, query)


def _pg_fulltext_search(db: Session, query: str) -> list[Incident]:
    """
    PostgreSQL full-text search across all meaningful incident fields.
    plainto_tsquery handles natural-language phrases without needing special syntax.
    """
    ids = db.execute(
        text("""
            SELECT id FROM incidents
            WHERE to_tsvector('english',
                coalesce(title, '')             || ' ' ||
                coalesce(description, '')       || ' ' ||
                coalesce(rca_notes, '')         || ' ' ||
                coalesce(remediation_steps, '') || ' ' ||
                coalesce(service, '')           || ' ' ||
                coalesce(team, '')
            ) @@ plainto_tsquery('english', :q)
            ORDER BY created_at DESC
            LIMIT 20
        """),
        {"q": query},
    ).scalars().all()

    if not ids:
        return []

    return db.query(Incident).filter(Incident.id.in_(ids)).all()


def _like_search(db: Session, query: str) -> list[Incident]:
    """Simple LIKE fallback used when running against SQLite locally."""
    term = f"%{query}%"
    return (
        db.query(Incident)
        .filter(or_(
            Incident.title.ilike(term),
            Incident.description.ilike(term),
            Incident.rca_notes.ilike(term),
            Incident.remediation_steps.ilike(term),
            Incident.service.ilike(term),
            Incident.team.ilike(term),
        ))
        .order_by(Incident.created_at.desc())
        .limit(20)
        .all()
    )
