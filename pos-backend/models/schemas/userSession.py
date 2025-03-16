from pydantic import BaseModel
from datetime import datetime

class UserSessionStatus(BaseModel):
    user_id: str
    username: str
    email: str
    role: str
    is_active: bool
    session_id: str | None = None
    login_time: datetime | None = None
    logout_time: datetime | None = None
    session_duration: str | None = None

    class Config:
        from_attributes = True


