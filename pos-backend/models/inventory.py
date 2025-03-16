from sqlalchemy import Column, String, Float, Text, ForeignKey, Enum, Date, Integer, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .baseModel import BaseModel
from enum import Enum as PyEnum
from datetime import timedelta
from utils.time_utils import current_time


class InventoryType(str, PyEnum):
    RAW_MATERIAL = "raw_material"
    EQUIPMENT = "equipment"


class InventoryStatus(str, PyEnum):
    IN_STOCK = "in_stock"
    ISSUED = "issued"
    RETURNED = "returned"
    DEPLETED = "depleted"
    LOW_STOCK = "low_stock"
    MAINTENANCE = "maintenance"  # For equipment
    DAMAGED = "damaged"  # For both
    EXPIRED = "expired"  # For raw materials
    DECOMMISSIONED = "decommissioned"  # For equipment


class TransactionType(str, PyEnum):
    ISSUE = "issue"
    RESTOCK = "restock"
    RETURN = "return"
    DAMAGE = "damage"
    WRITE_OFF = "write_off"
    MAINTENANCE = "maintenance"


class QuantityUnit(str, PyEnum):
    KG = "kg"
    GRAM = "gram"
    LITER = "liter"
    MILLILITER = "milliliter"
    PIECE = "piece"
    COUNT = "count"


class MaintenanceStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


inventory_suppliers = Table(
    "inventory_suppliers",
    BaseModel.metadata,
    Column("inventory_id", UUID(as_uuid=True), ForeignKey("inventories.id"), primary_key=True),
    Column("supplier_id", UUID(as_uuid=True), ForeignKey("suppliers.id"), primary_key=True)
)


# Base Inventory class (abstract)
class Inventory(BaseModel):
    __tablename__ = "inventories"
    __mapper_args__ = {"polymorphic_on": "inventory_type"}
    
    name = Column(String, nullable=False)
    description = Column(Text)
    price_per_unit = Column(Float, nullable=True)
    inventory_type = Column(Enum(InventoryType), nullable=False)
    status = Column(Enum(InventoryStatus), default=InventoryStatus.IN_STOCK)
    
    # Foreign keys
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    
    # Relationships
    suppliers = relationship("Supplier", secondary=inventory_suppliers, back_populates="inventories")

    invoices = relationship("InventoryInvoice", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory")


# RawMaterial class
class RawMaterial(Inventory):
    __tablename__ = "raw_materials"
    __mapper_args__ = {"polymorphic_identity": "raw_material"}
    
    id = Column(UUID(as_uuid=True), ForeignKey("inventories.id"), primary_key=True)
    quantity = Column(Float, default=0)
    quantity_unit = Column(Enum(QuantityUnit), nullable=False)
    batch_number = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    critical_threshold = Column(Float, nullable=True)  # Minimum quantity before considered critical
    is_perishable = Column(Boolean, default=False)
    
    def calculate_current_status(self) -> dict:
        """
        Calculate the current status of the raw material.
        """
        total_issued = sum(
            t.quantity for t in self.transactions 
            if t.transaction_type == TransactionType.ISSUE
        )
        total_restocked = sum(
            t.quantity for t in self.transactions 
            if t.transaction_type == TransactionType.RESTOCK
        )
        total_returned = sum(
            t.quantity for t in self.transactions 
            if t.transaction_type == TransactionType.RETURN
        )
        
        current_quantity = total_restocked - total_issued + total_returned
        
        status = {
            "current_quantity": current_quantity,
            "is_depleted": current_quantity <= 0,
            "is_critically_low": self.is_critically_low(),
            "total_transactions": len(self.transactions)
        }
        
        return status
    
    def is_critically_low(self) -> bool:
        """
        Check if the current quantity is below the critical threshold.
        """
        current_status = self.calculate_current_status()
        return (
            self.critical_threshold is not None and 
            current_status['current_quantity'] <= self.critical_threshold
        )


class Equipment(Inventory):
    __tablename__ = "equipment"
    __mapper_args__ = {"polymorphic_identity": "equipment"}
    
    id = Column(UUID(as_uuid=True), ForeignKey("inventories.id"), primary_key=True)
    total_units = Column(Integer, default=1)
    available_units = Column(Integer, default=1)
    maintenance_schedule = Column(Date, nullable=True)
    last_maintained = Column(Date, nullable=True)
    maintenance_threshold_hours = Column(Integer, nullable=True)

    maintenance_history = relationship("EquipmentMaintenance", back_populates="equipment")
    
    def is_maintenance_needed(self) -> bool:
        """
        Advanced maintenance need detection
        
        Returns:
            bool: Whether maintenance is required
        """
        # Check maintenance history
        recent_maintenance = (
            self.session.query(EquipmentMaintenance)
            .filter(
                EquipmentMaintenance.equipment_id == self.id,
                EquipmentMaintenance.status == MaintenanceStatus.COMPLETED
            )
            .order_by(EquipmentMaintenance.completed_date.desc())
            .first()
        )
        
        # If no recent maintenance, consider needed
        if not recent_maintenance:
            return True
        
        # Check time since last maintenance
        maintenance_interval = timedelta(days=90)  # Default to 90 days
        return (current_time() - recent_maintenance.completed_date) > maintenance_interval

    
    def calculate_current_status(self) -> dict:
        """
        Calculate the current status of the equipment.
        """
        issued_units = sum(
            t.quantity for t in self.transactions 
            if t.transaction_type == TransactionType.ISSUE
        )
        returned_units = sum(
            t.quantity for t in self.transactions 
            if t.transaction_type == TransactionType.RETURN
        )
        maintenance_count = sum(
            1 for t in self.transactions 
            if t.transaction_type == TransactionType.MAINTENANCE
        )
        
        current_available_units = self.total_units - issued_units + returned_units
        
        status = {
            "total_units": self.total_units,
            "available_units": current_available_units,
            "is_all_deployed": current_available_units == 0,
            "maintenance_count": maintenance_count,
            "needs_maintenance": self.is_maintenance_needed(),
            "total_transactions": len(self.transactions)
        }
        
        return status
    

class EquipmentMaintenance(BaseModel):
    """Model to track equipment maintenance history"""
    __tablename__ = "equipment_maintenance"
    
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    maintenance_type = Column(String, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.PENDING)
    priority = Column(String, nullable=False)
    estimated_duration = Column(Float, nullable=True)  # in hours
    actual_duration = Column(Float, nullable=True)
    
    equipment = relationship("Equipment", back_populates="maintenance_history")
    

class InventoryTransaction(BaseModel):
    __tablename__ = "inventory_transactions"
    
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventories.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    transaction_date = Column(DateTime, default=current_time, nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Additional metadata
    previous_status = Column(Enum(InventoryStatus), nullable=True)
    previous_quantity = Column(Float, nullable=True)
    resulting_quantity = Column(Float, nullable=True)
    is_locked = Column(Boolean, default=False, nullable=False)
    is_system_generated = Column(Boolean, default=False, nullable=False)
    
    # Add department_id foreign key
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    
    # Relationships
    inventory = relationship("Inventory", back_populates="transactions")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    department = relationship("Department", back_populates="transactions")


class Department(BaseModel):
    __tablename__ = "departments"
    
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    
    transactions = relationship("InventoryTransaction", back_populates="department")
