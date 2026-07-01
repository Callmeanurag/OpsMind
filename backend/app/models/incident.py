from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id                = Column(Integer, primary_key=True, index=True)
    title             = Column(String(255), nullable=False)
    description       = Column(Text)
    severity          = Column(String(50), default="medium")   # low | medium | high | critical
    status            = Column(String(50), default="open")     # open | investigating | resolved
    service           = Column(String(100))                     # name of the affected service
    team              = Column(String(100))                     # team that owns the service
    rca_notes         = Column(Text)                            # root cause analysis notes
    remediation_steps = Column(Text)                            # steps taken or recommended
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
