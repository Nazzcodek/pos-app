from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship
from .baseModel import BaseModel
from.inventory import inventory_suppliers


class Supplier(BaseModel):
    __tablename__ = "suppliers"
    
    company_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    email = Column(String)
    website = Column(String)
    phone_number = Column(String, nullable=False)
    address = Column(Text)
    items_supplied = Column(JSON, nullable=True, comment="List of items supplied by this vendor")
    
    # Relationships
    inventories = relationship("Inventory", secondary=inventory_suppliers, back_populates="suppliers")
    invoices = relationship("Invoice", back_populates="supplier")