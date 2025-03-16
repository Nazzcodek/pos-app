from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
import uuid

from models.engine.database import get_db
from services.auth import get_current_user
from services.permission import role_required
from models.schemas.supplier import InvoiceDetail
from models.inventory import Inventory
from models.invoice import Invoice, InventoryInvoice
from models.supplier import Supplier
from models.schemas.invoice import (
    InvoiceCreate, 
    InvoiceUpdate, 
    Invoice as InvoiceSchema, 
)

router = APIRouter(tags=["invoices"])

@router.post("/create", response_model=InvoiceDetail, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'invoices', 'create')
async def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Validate supplier
    supplier = db.query(Supplier).filter(Supplier.id == invoice.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check for unique invoice number for the same supplier
    existing_invoice = db.query(Invoice).filter(
        Invoice.invoice_number == invoice.invoice_number,
        Invoice.supplier_id == invoice.supplier_id
    ).first()
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Invoice number must be unique for the same supplier")
    
    # Create invoice without items first
    invoice_data = invoice.dict(exclude={"inventory_items"})
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    # Add inventory items
    for item in invoice.inventory_items:
        # Validate inventory exists
        inventory = db.query(Inventory).filter(Inventory.id == item.inventory_id).first()
        if not inventory:
            db.delete(db_invoice)
            db.commit()
            raise HTTPException(status_code=404, detail=f"Inventory with ID {item.inventory_id} not found")
        
        # Create junction record
        inv_invoice = InventoryInvoice(
            inventory_id=item.inventory_id,
            invoice_id=db_invoice.id,
            quantity=item.quantity,
            quantity_unit=item.quantity_unit,
            unit_price=item.unit_price
        )
        db.add(inv_invoice)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/all", response_model=List[InvoiceSchema])
@role_required(["supervisor"], 'invoices', 'read')
async def get_all_invoices(
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[uuid.UUID] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    is_paid: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Invoice)
    
    if supplier_id:
        query = query.filter(Invoice.supplier_id == supplier_id)
    
    if from_date:
        query = query.filter(Invoice.invoice_date >= from_date)
    
    if to_date:
        query = query.filter(Invoice.invoice_date <= to_date)
    
    if is_paid is not None:
        query = query.filter(Invoice.is_paid == is_paid)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{invoice_id}", response_model=InvoiceDetail)
@role_required(["supervisor"], 'invoices', 'read')
async def get_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Add options to eagerly load inventory_items
    invoice = db.query(Invoice).options(
        joinedload(Invoice.inventory_items).joinedload(InventoryInvoice.inventory)
    ).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceSchema)
@role_required(["manager"], 'invoices', 'update')
async def update_invoice(
    invoice_id: uuid.UUID,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_invoice, key, value)
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
@role_required(["admin"], 'invoices', 'delete')
async def delete_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(db_invoice)
    db.commit()
    return None

@router.patch("/{invoice_id}/toggle", response_model=bool)
@role_required(["manager"], 'invoices', 'update')
async def toggle_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return db_invoice.toggle_enabled(db)

@router.patch("/{invoice_id}/mark-paid", response_model=InvoiceSchema)
@role_required(["manager"], 'invoices', 'update')
def mark_invoice_paid(
    invoice_id: uuid.UUID,
    payment_date: date = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_invoice.is_paid = True
    db_invoice.payment_date = payment_date or date.today()
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/for-inventory/{inventory_id}", response_model=List[InvoiceDetail])
@role_required(["supervisor"], 'invoices', 'read')
async def get_invoices_for_inventory(
    inventory_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if inventory exists
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Get all invoices related to this inventory
    invoices = db.query(Invoice)\
        .join(InventoryInvoice, InventoryInvoice.invoice_id == Invoice.id)\
        .filter(InventoryInvoice.inventory_id == inventory_id)\
        .all()
    
    return invoices