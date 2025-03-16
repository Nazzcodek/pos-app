from sqlalchemy.orm import Session
from models.user import UserSession
from typing import Optional
from uuid import UUID
from utils.time_utils import current_time

class SessionManager:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_session(self, user_id: UUID) -> UserSession:
        """Get existing active session or create new one if none exists"""
        active_session = self.get_active_session(user_id)
        
        if active_session:
            return active_session
            
        # Create new session only if no active session exists
        session = UserSession(
            user_id=user_id,
            login_time=current_time(),
            expires=False,
            logout_time=None
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_active_session(self, user_id: UUID) -> Optional[UserSession]:
        """Get the active session for a user"""
        return self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.expires == False,
            UserSession.logout_time == None
        ).first()

    def terminate_session(self, user_id: UUID) -> bool:
        """Terminate the user's active session"""
        active_session = self.get_active_session(user_id)
        if active_session:
            active_session.expires = True
            active_session.logout_time = current_time()
            self.db.commit()
            return True
        return False