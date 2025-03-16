from models.schemas.product import ProductResponse, ToggleResponse
from models.product import Product
from models.category import Category
from models.user import User
from models.engine.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from services.permission import role_required
from services.auth import get_current_user, delete
from uuid import UUID
from utils.imageUpload import save_thumbnail
from decimal import Decimal
from typing import Optional


router = APIRouter(tags=["Products"])


@router.post("/create", response_model=ProductResponse)
@role_required(["manager"], 'products', 'create')
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: Decimal = Form(...),
    category_id: UUID = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_product = db.query(Product).filter(func.lower(Product.name) == name.lower()).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this name already exists"
        )

    # Save image
    image_path = save_thumbnail(image.file, folder="products")

    # Create new product
    new_product = Product(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        image=image_path
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/all", response_model=list[ProductResponse])
@role_required(["supervisor"], 'products', 'read')
async def get_all_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    products = db.query(Product).all()
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No products found"
        )
    return products


@router.get("/{product_id}", response_model=ProductResponse)
@role_required(["cashier"], 'products', 'read')
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    product = db.query(product).get(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.get("/category/{category_id}", response_model=list[ProductResponse])
@role_required(["cashier"], 'products', 'read')
async def get_products_by_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    category = db.query(Category).get(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    products = db.query(Product).filter(Product.category_id == category_id).all()
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No product found"
        )
    return products

@router.get("/enabled/category/{category_id}", response_model=list[ProductResponse])
@role_required(["cashier"], 'products', 'read')
async def get_enabled_products_by_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch the category by ID
    category = db.query(Category).get(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Fetch enabled products in the specified category
    products = db.query(Product).filter(
        Product.category_id == category_id,
        Product.is_enabled == True
        ).all()
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No product found"
        )
    
    return products

@router.put("/{product_id}", response_model=ProductResponse)
@role_required(["manager"], 'products', 'update')
async def update_product(
        product_id: UUID,
        name: Optional[str] = Form(None),
        description: Optional[str] = Form(None),
        price: Optional[Decimal] = Form(None),
        category_id: Optional[UUID] = Form(None),
        image: Optional[UploadFile] = File(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    update_data = {}

    if name:
        existing_product = db.query(Product).filter(func.lower(Product.name) == name.lower()).first()
        if existing_product and existing_product.id != product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this name already exists"
            )
        update_data["name"] = name

    if description:
        update_data["description"] = description
    if price:
        update_data["price"] = price
    if category_id:
        update_data["category_id"] = category_id

    # Handle image upload
    if image:
        image_path = save_thumbnail(image.file, folder="products")
        update_data["image"] = image_path

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/delete/{product_id}", status_code=status.HTTP_200_OK)
@role_required(['admin'], 'products', 'delete')
async def delete_record_endpoint(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete endpoint that can be used for any model."""
    result = delete(
        db=db,
        model=Product,
        record_id=product_id,
        current_user=current_user,
        resource_name="products"
    )
    return {"message": "product deleted successfully"}


@router.put("/toggle-status/{product_id}")
@role_required(['supervisor'], 'toggles', 'action')
async def toggle_product_enabled(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to toggle is_enabled for a given product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Fetch the category of the product
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Ensure the category is enabled before enabling the product
    if not category.is_enabled and not product.is_enabled:
        raise HTTPException(
            status_code=400,
            detail="Cannot enable product because its category is disabled"
        )

    new_status = product.toggle_enabled(db)
    return {"message": "Toggled successfully", "is_enabled": new_status}