import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from pydantic import EmailStr
from typing import Dict, Any, Optional
from services.permission import role_required
from models.user import User
from services.auth import get_current_user
from models.engine.database import get_db
from sqlalchemy.orm import Session
from models.schemas.settings import SettingsUpdate
from models.settings import Settings
from utils.imageUpload import save_thumbnail


router = APIRouter(tags=["Settings"])

@router.get("/info", response_model=SettingsUpdate)
async def get_product(
    id: int = 1,
    db: Session = Depends(get_db),
    ):
    settings = db.query(Settings).get(id)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )
    return settings
@router.post("/update", response_model=SettingsUpdate)
@role_required(['supervisor'], 'settings', 'update')
async def update_settings(
    business_name: Optional[str] = Form(None),
    restaurant_name: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    street: Optional[str] = Form(None),
    zip_code: Optional[float] = Form(None),
    country: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[EmailStr] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = db.query(Settings).get(1)
    if not settings:
        settings = Settings(id=1)
        db.add(settings)

    update_data = {
        "business_name": business_name,
        "restaurant_name": restaurant_name,
        "city": city,
        "state": state,
        "street": street,
        "zip_code": zip_code,
        "country": country,
        "phone": phone,
        "email": email,
    }

    if image:
        # Delete the existing logo file if it exists
        if settings.image:
            existing_logo_path = os.path.join("uploads", settings.image)
            if os.path.exists(existing_logo_path):
                os.remove(existing_logo_path)
        
        # Save the new logo file
        image_path = save_thumbnail(image.file, folder="logo")
        update_data["image"] = image_path

    for key, value in update_data.items():
        if value is not None:
            setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return settings