from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.routes.incidents import IncidentResponse
from app.services.search_service import search_incidents

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=list[IncidentResponse])
def search(
    q: str = Query(..., min_length=1, description="Keyword or phrase to search for"),
    db: Session = Depends(get_db),
):
    return search_incidents(db, q)
