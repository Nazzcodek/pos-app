from sqlalchemy import Column, String, Numeric, Integer
from .engine.database import Base


class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True, default=1)
    business_name = Column(String, nullable=True)
    restaurant_name = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    street = Column(String, nullable=True)
    zip_code = Column(Numeric, nullable=True)
    country = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    image = Column(String, nullable=True)

