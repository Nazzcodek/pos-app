from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from decimal import Decimal
from .baseSchema import BaseSchema
from models.schemas.category import CategoryResponse


class ProductCreate(BaseModel):
    name: str
    description: str
    price:  Decimal = Field(ge=0, decimal_places=2)
    category_id: UUID
    image: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    category_id: Optional[UUID] = None
    is_enabled: Optional[bool] = None
    image: Optional[str] = None


class ProductResponse(BaseSchema):
    name: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[CategoryResponse]
    image: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}

class ToggleResponse(BaseModel):
    is_enabled: bool
    
    class Config:
        from_attributes = True
