from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Union
from datetime import datetime, date
from .baseSchema import BaseSchema
from uuid import UUID
from models.inventory import (
    QuantityUnit, 
    InventoryType, 
    InventoryStatus, 
    TransactionType, 
    MaintenanceStatus
)

class InventoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_unit: Optional[float] = None
    supplier_id: Optional[UUID] = None
    inventory_type: InventoryType
    status: InventoryStatus = InventoryStatus.IN_STOCK

    @field_validator('price_per_unit')
    def price_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be positive')
        return v

class RawMaterialCreate(InventoryBase):
    quantity: float = 0
    quantity_unit: QuantityUnit
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    critical_threshold: Optional[float] = None
    is_perishable: bool = False
    
    @field_validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Quantity must be positive')
        return v

    @field_validator('inventory_type')
    def must_be_raw_material(cls, v):
        if v != InventoryType.RAW_MATERIAL:
            raise ValueError('Inventory type must be raw material')
        return v

class RawMaterial(RawMaterialCreate):
    id: UUID
    inventory_type: InventoryType = InventoryType.RAW_MATERIAL
    created_at: datetime
    updated_at: datetime
    is_enabled: bool = True

    class Config:
        from_attribute = True

class EquipmentCreate(InventoryBase):
    total_units: int = 1
    available_units: Optional[int] = None
    maintenance_schedule: Optional[date] = None
    last_maintained: Optional[date] = None
    maintenance_threshold_hours: Optional[int] = None
    
    @field_validator('inventory_type')
    def must_be_equipment(cls, v):
        if v != InventoryType.EQUIPMENT:
            raise ValueError('Inventory type must be equipment')
        return v
    
    @field_validator('total_units', 'available_units')
    def units_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Units must be positive')
        return v
    
class Equipment(EquipmentCreate):
    id: UUID
    inventory_type: InventoryType = InventoryType.EQUIPMENT
    created_at: datetime
    updated_at: datetime
    is_enabled: bool = True

    class Config:
        from_attribute = True

class Inventory(BaseSchema, InventoryBase):
    inventory_type: InventoryType
    
    # Fields that might be present depending on the type
    quantity: Optional[float] = None
    quantity_unit: Optional[QuantityUnit] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    critical_threshold: Optional[float] = None
    is_perishable: Optional[bool] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    maintenance_schedule: Optional[date] = None
    last_maintained: Optional[date] = None
    maintenance_threshold_hours: Optional[int] = None

    class Config:
        from_attribute = True

class RawMaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    supplier_id: Optional[UUID] = None
    quantity_unit: Optional[QuantityUnit] = None
    price_per_unit: Optional[float] = None
    status: Optional[InventoryStatus] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    critical_threshold: Optional[float] = None
    is_perishable: Optional[bool] = None

    @field_validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity must be positive')
        return v

    @field_validator('price_per_unit')
    def price_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be positive')
        return v

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    supplier_id: Optional[UUID] = None
    description: Optional[str] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    price_per_unit: Optional[float] = None
    status: Optional[InventoryStatus] = None
    maintenance_schedule: Optional[date] = None
    last_maintained: Optional[date] = None
    maintenance_threshold_hours: Optional[int] = None
    
    @field_validator('price_per_unit')
    def price_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be positive')
        return v

class EquipmentMaintenanceCreate(BaseModel):
    equipment_id: UUID
    maintenance_type: str
    scheduled_date: datetime
    status: MaintenanceStatus = MaintenanceStatus.PENDING
    priority: str
    estimated_duration: Optional[float] = None  # in hours
    
class EquipmentMaintenance(EquipmentMaintenanceCreate):
    id: UUID
    completed_date: Optional[datetime] = None
    actual_duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attribute = True

class TransactionCreate(BaseModel):
    inventory_id: UUID
    transaction_type: TransactionType
    quantity: float
    department_id: Optional[UUID] = None
    notes: Optional[str] = None
    
    @field_validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v

class Transaction(BaseSchema):
    inventory_id: UUID
    transaction_type: TransactionType
    quantity: float
    transaction_date: datetime
    department_id: Optional[UUID] = None
    previous_status: Optional[InventoryStatus] = None
    previous_quantity: Optional[float] = None
    resulting_quantity: Optional[float] = None
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    quantity: Optional[float] = None
    transaction_type: Optional[TransactionType] = None
    department_id: Optional[UUID] = None
    notes: Optional[str] = None

    @field_validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
class TransactionDetail(Transaction):
    user_name: Optional[str] = None
    inventory_name: Optional[str] = None
    department_name: Optional[str] = None

class SummaryReport(BaseModel):
    total_inventory_items: int
    items_by_type: Dict[str, int]
    transaction_summary: Dict[str, float]

class LowStockReport(BaseModel):
    low_stock_items: List[Dict[str, Union[str, float]]]

class InventoryValueReport(BaseModel):
    total_inventory_value: float
    value_changes_by_transaction_type: Dict[str, float]

class InventoryUsageReport(BaseModel):
    top_used_items: List[Dict[str, Union[str, float]]]

class InventoryReportResponse(BaseModel):
    report_type: str
    start_date: Optional[date]
    end_date: Optional[date]
    data: Union[SummaryReport, LowStockReport, InventoryValueReport, InventoryUsageReport]

class Department(BaseSchema):
    name: str
    description: Optional[str] = None

    class Config:
        from_attribute = True


# Update forward reference
TransactionDetail.update_forward_refs()