from models.schemas.category import CategoryResponse
from models.category import Category
from models.user import User
from uuid import UUID
from models.engine.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import func
from sqlalchemy.orm import Session
from services.permission import role_required
from services.auth import get_current_user, delete
from utils.imageUpload import save_thumbnail
from typing import Optional


router = APIRouter(tags=['Categories'])


@router.post("/create", response_model=CategoryResponse)
@role_required(["manager"], 'categories', 'create')
async def create_category(
    name: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_category = db.query(Category).filter(func.lower(Category.name) == name.lower()).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    # Save the image if provided
    image_path = save_thumbnail(image.file, folder="categories") if image else None

    # Create new category
    new_category = Category(
        name=name,
        description=description,
        image=image_path
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category


@router.get("/all", response_model=list[CategoryResponse])
@role_required(["supervisor"], 'categories', 'read')
async def get_all_categories(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
    ):
    categories = db.query(Category).all()
    if not categories:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No categories found"
        )
    return categories

@router.get("/enabled", response_model=list[CategoryResponse])
@role_required(["cashier"], 'categories', 'read')
async def get_enabled_categories(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
    ):
    categories = db.query(Category).filter(Category.is_enabled == True).all()
    if not categories:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No categories found"
        )
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
@role_required(["cashier"], 'categories', 'read')
async def get_category(
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
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
@role_required(["manager"], 'categories', 'update')
async def update_category(
    category_id: UUID,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_category = db.query(Category).get(category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Update fields
    if name:
        existing_category = db.query(Category).filter(func.lower(Category.name) == name.lower()).first()
        if existing_category and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        db_category.name = name
    if description:
        db_category.description = description
    if image:
        image_path = save_thumbnail(image.file, folder="categories")
        db_category.image = image_path

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
@role_required(['admin'], 'categories', 'delete')
async def delete_record_endpoint(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete endpoint that can be used for any model."""
    result = delete(
        db=db,
        model=Category,
        record_id=category_id,
        current_user=current_user,
        resource_name="categories"
    )
    return {"message": "Category deleted successfully"}


@router.put("/toggle-status/{category_id}")
@role_required(['supervisor'], 'toggles', 'action')
async def toggle_model_status(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    """Endpoint to toggle is_enabled for a given model by ID"""
    instance = db.query(Category).filter(Category.id == category_id).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Category not found")

    new_status = instance.toggle_enabled(db)
    return {"message": "Toggled successfully", "is_enabled": new_status}