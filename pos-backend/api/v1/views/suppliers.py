from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import String, or_
from typing import List, Optional
import uuid

from models.engine.database import get_db
from services.auth import get_current_user
from services.permission import role_required
from models.supplier import Supplier
from models.schemas.supplier import(
    SupplierCreate,
    SupplierUpdate,
    Supplier as SupplierSchema,
    SupplierDetail
    )

router = APIRouter(tags=["suppliers"])

@router.post("/create", response_model=SupplierSchema, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'suppliers', 'create')
async def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if supplier.company_name:
        existing_supplier = db.query(Supplier).filter(Supplier.company_name == supplier.company_name).first()
        if existing_supplier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this company name already exists"
            )
        
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/all", response_model=List[SupplierSchema])
@role_required(["supervisor"], 'suppliers', 'read')
async def get_all_suppliers(
    skip: int = 0,
    limit: int = 100,
    items_supplied: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Supplier)
    
    if items_supplied:
        query = query.filter(Supplier.items_supplied.cast(String).ilike(f"%{items_supplied}%"))
    
    return query.offset(skip).limit(limit).all()

@router.get("/{supplier_id}", response_model=SupplierDetail)
@role_required(["supervisor"], 'suppliers', 'read')
async def get_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
@role_required(["manager"], 'suppliers', 'update')
async def update_supplier(
    supplier_id: uuid.UUID,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
@role_required(["admin"], 'suppliers', 'delete')
async def delete_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(db_supplier)
    db.commit()
    return None

@router.patch("/{supplier_id}/toggle", response_model=bool)
@role_required(["supervisor"], 'suppliers', 'update')
async def toggle_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return db_supplier.toggle_enabled(db)