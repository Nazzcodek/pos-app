from sqlalchemy import Column, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .baseModel import BaseModel

class Product(BaseModel):
    __tablename__ = "products"

    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String, nullable=True)

    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)

    category = relationship("Category", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product") 
