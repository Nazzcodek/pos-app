from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from .engine.database import Base
import uuid
from utils.time_utils import current_time


class BaseModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=current_time)
    updated_at = Column(DateTime, default=current_time, onupdate=current_time)
    is_enabled = Column(Boolean, default=True)

    def toggle_enabled(self, db: Session):
        """Toggle the is_enabled field and commit the change."""
        self.is_enabled = not self.is_enabled
        db.add(self)
        db.commit()
        db.refresh(self)
        return self.is_enabled