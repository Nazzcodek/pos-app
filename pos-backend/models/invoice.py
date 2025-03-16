from sqlalchemy import Column, String, Float, Text, ForeignKey, Date, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .baseModel import BaseModel
from .inventory import QuantityUnit


class Invoice(BaseModel):
    __tablename__ = "invoices"
    
    invoice_number = Column(String, nullable=False, unique=True)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    is_paid = Column(Boolean, default=False)
    payment_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Foreign keys
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="invoices")
    inventory_items = relationship("InventoryInvoice", back_populates="invoice")

 
class InventoryInvoice(BaseModel):
    """Junction table to handle many-to-many relationship between inventory and invoices"""
    __tablename__ = "inventory_invoices"
    
    quantity = Column(Float, nullable=False)
    quantity_unit = Column(Enum(QuantityUnit), nullable=False)
    unit_price = Column(Float, nullable=False)
    
    # Foreign keys
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventories.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    
    # Relationships
    inventory = relationship("Inventory", back_populates="invoices")
    invoice = relationship("Invoice", back_populates="inventory_items")