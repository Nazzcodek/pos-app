from sqlalchemy import Column, String
from sqlalchemy.orm import relationship, Session
from .baseModel import BaseModel
from .product import Product

class Category(BaseModel):
    __tablename__ = "categories"

    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)

    # Relationship: A category can have multiple products
    products = relationship("Product", back_populates="category")

    def toggle_enabled(self, db: Session):
        """Toggle the is_enabled field and update all related products."""
        self.is_enabled = not self.is_enabled
        db.add(self)

        # If category is disabled, disable all products under it
        db.query(Product).filter(Product.category_id == self.id).update(
            {"is_enabled": self.is_enabled}
        )
        
        db.commit()
        db.refresh(self)
        return self.is_enabled
