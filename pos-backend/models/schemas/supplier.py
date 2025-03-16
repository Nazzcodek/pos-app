from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import Optional, List, Union, Dict
from .baseSchema import BaseSchema
from .inventory import Inventory
from .invoice import Invoice, InventoryInvoice

class ItemSupplied(BaseModel):
    name: str

class SupplierBase(BaseModel):
    company_name: str
    contact_person: str
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    phone_number: str
    address: Optional[str] = None
    items_supplied: Optional[List[Union[ItemSupplied, Dict[str, str]]]] = None

    @field_validator('website')
    def validate_website(cls, v):
        if v is None:
            return v
        try:
            # Use the HttpUrl type to validate, but keep returning the string
            HttpUrl(v)
            return v
        except ValueError:
            raise ValueError('Invalid URL')

    @field_validator('items_supplied', mode='before')
    def normalize_items_supplied(cls, v):
        if v is None:
            return v
        
        # Convert each item to a dictionary with 'name' key if it's not already
        return [
            item if isinstance(item, dict) and 'name' in item 
            else {'name': item['name'] if isinstance(item, dict) else str(item)} 
            for item in v
        ]

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone_number: Optional[str] = None
    items_supplied: Optional[List[Union[ItemSupplied, Dict[str, str]]]] = None
    

class Supplier(SupplierBase, BaseSchema):
    pass

class SupplierDetail(Supplier):
    inventories: List[Inventory] = []
    invoices: List[Invoice] = []


class InventoryDetail(Inventory):
    supplier: Optional[Supplier] = None


class InvoiceDetail(Invoice):
    supplier: Supplier
    inventory_items: List["InventoryInvoice"] = []


InventoryDetail.update_forward_refs()
SupplierDetail.update_forward_refs()
InvoiceDetail.update_forward_refs()