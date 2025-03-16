from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from .baseModel import BaseModel
from utils.time_utils import current_time
from sqlalchemy.dialects.postgresql import UUID


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(BaseModel):
    __tablename__ = "users"

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default='cashier')
    is_active = Column(Boolean, default=False)

    sales = relationship("Sale", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")

    created_transactions = relationship(
        "InventoryTransaction",
        back_populates="created_by",
        foreign_keys="InventoryTransaction.created_by_id"
        )
    updated_transactions = relationship(
        "InventoryTransaction",
        back_populates="updated_by",
        foreign_keys="InventoryTransaction.updated_by_id"
        )

    def verify_password(self, pwd: str):
        return pwd_context.verify(pwd, self.password)
    
    @classmethod
    def hash_password(cls, password: str):
        return pwd_context.hash(password)
    

class TokenBlacklist(BaseModel):
    __tablename__ = "token_blacklist"

    token = Column(String, unique=True, index=True)
    blacklisted_on = Column(DateTime, default=current_time)


class UserSession(BaseModel):
    __tablename__ = "user_sessions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires = Column(Boolean, default=False, nullable=False)
    login_time = Column(DateTime(timezone=True), nullable=False, default=current_time)
    logout_time = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
    sales = relationship("Sale", back_populates="session")
    