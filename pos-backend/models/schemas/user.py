from pydantic import BaseModel, EmailStr, UUID4, validator, Field
from typing import Optional
from .baseSchema import BaseSchema


# Schema for creating a user

class UserBasic(BaseSchema):
    first_name: str
    last_name:str
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    password: str
    role: str = 'cashier'

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = {'admin', 'manager', 'supervisor', 'cashier'}
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of {allowed_roles}')
        return v

# Schema for updating a user
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = {'admin', 'manager', 'supervisor', 'cashier'}
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of {allowed_roles}')
        return v

# Schema for user response (inherits from BaseSchema)
class UserResponse(BaseSchema):
    first_name: str
    last_name:str
    username: str
    email: EmailStr
    role: str
    is_active: bool
    is_enabled: bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str
    
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

