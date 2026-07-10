from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.incident import Incident

router = APIRouter(prefix="/incidents", tags=["Incidents"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    service: Optional[str] = None
    team: Optional[str] = None
    rca_notes: Optional[str] = None
    remediation_steps: Optional[str] = None


class IncidentClose(BaseModel):
    resolution_summary: Optional[str] = None
    rca_notes: Optional[str] = None
    remediation_steps: Optional[str] = None
    preventive_actions: Optional[str] = None
    resolved_by: Optional[str] = None
    closure_comment: Optional[str] = None


class IncidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    service: Optional[str] = None
    team: Optional[str] = None
    rca_notes: Optional[str] = None
    remediation_steps: Optional[str] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    resolution_summary: Optional[str] = None
    preventive_actions: Optional[str] = None
    resolved_by: Optional[str] = None
    closure_comment: Optional[str] = None
    tta_minutes: Optional[int] = None
    tte_minutes: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/", response_model=IncidentResponse, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.patch("/{incident_id}/acknowledge", response_model=IncidentResponse)
def acknowledge_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    now = datetime.now(timezone.utc)
    created = incident.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    incident.status = "acknowledged"
    incident.acknowledged_at = now
    incident.tta_minutes = int((now - created).total_seconds() / 60)
    db.commit()
    db.refresh(incident)
    return incident


@router.patch("/{incident_id}/close", response_model=IncidentResponse)
def close_incident(incident_id: int, payload: IncidentClose, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    now = datetime.now(timezone.utc)
    created = incident.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    incident.status = "closed"
    incident.resolved_at = now
    incident.closed_at = now
    incident.tte_minutes = int((now - created).total_seconds() / 60)
    if payload.resolution_summary:
        incident.resolution_summary = payload.resolution_summary
    if payload.rca_notes:
        incident.rca_notes = payload.rca_notes
    if payload.remediation_steps:
        incident.remediation_steps = payload.remediation_steps
    if payload.preventive_actions:
        incident.preventive_actions = payload.preventive_actions
    if payload.resolved_by:
        incident.resolved_by = payload.resolved_by
    if payload.closure_comment:
        incident.closure_comment = payload.closure_comment
    db.commit()
    db.refresh(incident)
    return incident
