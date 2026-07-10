from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id                = Column(Integer, primary_key=True, index=True)
    title             = Column(String(255), nullable=False)
    description       = Column(Text)
    severity          = Column(String(50), default="medium")   # low | medium | high | critical
    status            = Column(String(50), default="open")     # open | investigating | acknowledged | resolved | closed
    service           = Column(String(100))
    team              = Column(String(100))
    rca_notes         = Column(Text)
    remediation_steps = Column(Text)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    # Lifecycle timestamps
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at     = Column(DateTime(timezone=True), nullable=True)
    closed_at       = Column(DateTime(timezone=True), nullable=True)

    # Closure fields
    resolution_summary = Column(Text, nullable=True)
    preventive_actions = Column(Text, nullable=True)
    resolved_by        = Column(String(100), nullable=True)
    closure_comment    = Column(Text, nullable=True)

    # Response-time metrics
    tta_minutes = Column(Integer, nullable=True)  # time from created_at to acknowledged_at
    tte_minutes = Column(Integer, nullable=True)  # time from created_at to closed_at
