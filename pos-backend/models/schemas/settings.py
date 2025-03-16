from pydantic import BaseModel, EmailStr
from typing import Optional


class SettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    restaurant_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    street: Optional[str] = None
    zip_code: Optional[float] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[str] = None 