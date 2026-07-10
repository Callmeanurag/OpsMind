from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.incident import Incident
from app.services.ai_service import summarize_incident, quick_fix_incident

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    incident_id: int


class SummarizeResponse(BaseModel):
    summary: str
    probable_cause: str
    remediation: str


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/summarize", response_model=SummarizeResponse)
def summarize(payload: SummarizeRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return summarize_incident(incident)


# ── Quick Fix ─────────────────────────────────────────────────────────────────

class QuickFixRequest(BaseModel):
    incident_id: int


class QuickFixResponse(BaseModel):
    likely_issue: str
    quick_fixes: list[str]
    commands: list[str]
    verification_steps: list[str]
    escalate_to: str


@router.post("/quick-fix", response_model=QuickFixResponse)
def quick_fix(payload: QuickFixRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return quick_fix_incident(incident)
