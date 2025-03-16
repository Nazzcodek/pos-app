from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from .baseSchema import BaseSchema
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class SaleItemCreate(BaseModel):
    product_id: UUID
    quantity: int

class SaleCreate(BaseModel):
    items: list[SaleItemCreate]

    class Config:
        arbitrary_types_allowed = True

class SaleTableRow(BaseSchema):
    sale_id: UUID
    date_time: datetime
    total: Decimal
    receipt_number: str
    username: str
    total_items: int

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}

class SaleSummary(BaseModel):
    rows: List[SaleTableRow]
    summary: Dict[str, Any]
    page: int
    page_size: int


class SaleItemTableRow(BaseModel):
    product_id: UUID
    username: str
    date_time: datetime
    product: str
    category: str
    quantity: int
    unit_price: Decimal
    total: Decimal
    session_start: datetime

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}

class SaleItemsSummary(BaseModel):
    rows: List[SaleItemTableRow]
    summary: Dict[str, Any]

class productResponse(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)
    
class SaleItemResponse(BaseModel):
    id: UUID
    sale_id: UUID
    product: productResponse
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)

class SaleResponse(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    total_amount: Decimal
    timestamp: datetime
    receipt_number: str
    items: List[SaleItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: float(v)}
    )