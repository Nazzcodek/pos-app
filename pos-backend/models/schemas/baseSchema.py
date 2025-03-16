from pydantic import BaseModel, UUID4, Field
from datetime import datetime, timezone
import uuid
from models.baseModel import current_time

class BaseSchema(BaseModel):
    id: UUID4 = Field(default_factory=uuid.uuid4)  # Use UUID4 instead of str
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)
    is_enabled: bool = Field(default=True)

    class Config:
        from_attributes = True

