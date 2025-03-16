from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .baseModel import BaseModel
from utils.time_utils import current_time

class Sale(BaseModel):
    __tablename__ = "sales"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("user_sessions.id"))
    total_amount = Column(Numeric(10, 2))
    timestamp = Column(DateTime, default=current_time)
    receipt_number = Column(String, unique=True, index=True)

    user = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")
    session = relationship("UserSession", back_populates="sales")


class SaleItem(BaseModel):
    __tablename__ = "sale_items"

    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Numeric(10, 2))
    total_price = Column(Numeric(10, 2))

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")
