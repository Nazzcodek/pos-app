from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date
from .baseSchema import BaseSchema
from .inventory import Inventory, QuantityUnit
from uuid import UUID


# InventoryInvoice Schemas (Junction)
class InventoryInvoiceBase(BaseModel):
    quantity: float
    quantity_unit: QuantityUnit
    unit_price: float
    inventory_id: UUID
    invoice_id: UUID

    @validator('quantity', 'unit_price')
    def values_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Values must be positive')
        return v


class InventoryInvoiceCreate(BaseModel):
    quantity: float
    quantity_unit: QuantityUnit
    unit_price: float
    inventory_id: UUID

    @validator('quantity', 'unit_price')
    def values_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Values must be positive')
        return v


class InventoryInvoiceUpdate(BaseModel):
    quantity: Optional[float] = None
    quantity_unit: Optional[QuantityUnit] = None
    unit_price: Optional[float] = None

    @validator('quantity', 'unit_price')
    def values_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Values must be positive')
        return v


class InventoryInvoice(InventoryInvoiceBase, BaseSchema):
    pass


class InvoiceBase(BaseModel):
    invoice_number: str
    invoice_date: date
    due_date: date
    total_amount: float
    is_paid: bool = False
    payment_date: Optional[date] = None
    notes: Optional[str] = None
    supplier_id: UUID

    @validator('total_amount')
    def amount_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Amount must be positive')
        return v


class InvoiceCreate(InvoiceBase):
    inventory_items: List[InventoryInvoiceCreate] = []


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    total_amount: Optional[float] = None
    is_paid: Optional[bool] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @validator('total_amount')
    def amount_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Amount must be positive')
        return v


class Invoice(InvoiceBase, BaseSchema):
    # Add the relationship to inventory_items
    inventory_items: List[InventoryInvoice] = []


# Update InvoiceDetail for nested relationships
class InvoiceDetail(Invoice):
    inventory_items: List["InventoryInvoiceDetail"] = []


# Now define InventoryInvoiceDetail which requires Invoice to be defined first
class InventoryInvoiceDetail(InventoryInvoice):
    inventory: Optional[Inventory] = None
    # Use ForwardRef for invoice to avoid circular reference
    # or just exclude the invoice reference in the detail since it would be redundant
