from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date
from uuid import UUID

from models.engine.database import get_db
from models.user import User
from services.auth import get_current_user
from models.inventory import (
    InventoryType, InventoryStatus, QuantityUnit, 
    TransactionType, Inventory, Department
)
from models.schemas.inventory import (
    RawMaterialCreate, EquipmentCreate,
    RawMaterialUpdate, EquipmentUpdate,
    RawMaterial as RawMaterialSchema,
    Equipment as EquipmentSchema, 
    TransactionCreate, Transaction,
    TransactionUpdate, InventoryReportResponse,
    Department as DepartmentSchema
)
from services.permission import role_required
from services.inventory import InventoryService

router = APIRouter(tags=["inventories"])

# Inventory Creation Endpoints
@router.post("/raw-materials", response_model=RawMaterialSchema, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'inventories', 'create')
async def create_raw_material(
    inventory: RawMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new raw material inventory item"""
    inventory_service = InventoryService(db)
    return inventory_service.create_raw_material(inventory, current_user)

@router.post("/equipment", response_model=EquipmentSchema, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'inventories', 'create')
async def create_equipment(
    inventory: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new equipment inventory item"""
    inventory_service = InventoryService(db)
    return inventory_service.create_equipment(inventory, current_user)

# Inventory Retrieval Endpoints
@router.get("/raw-materials/", response_model=List[RawMaterialSchema])
@role_required(["supervisor"], 'inventories', 'read')
async def get_raw_materials(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    status: Optional[InventoryStatus] = None,
    quantity_unit: Optional[QuantityUnit] = None,
    supplier_id: Optional[UUID] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve raw materials with optional filtering"""
    inventory_service = InventoryService(db)
    return inventory_service.get_raw_materials(
        skip, limit, name, status, quantity_unit, supplier_id, 
        price_min, price_max, from_date, to_date
    )

@router.get("/equipments/", response_model=List[EquipmentSchema])
async def get_equipment(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    status: Optional[InventoryStatus] = None,
    supplier_id: Optional[UUID] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    return service.get_equipment(
        skip=skip,
        limit=limit,
        name=name,
        status=status,
        supplier_id=supplier_id,
        price_min=price_min,
        price_max=price_max,
        from_date=from_date,
        to_date=to_date
    )

# Advanced Search Endpoint
@router.get("/search/", response_model=List[Dict])
@role_required(["supervisor"], 'inventories', 'read')
async def advanced_inventory_search(
    search_term: Optional[str] = None,
    inventory_type: Optional[InventoryType] = None,
    status_list: Optional[List[InventoryStatus]] = Query(None),
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    quantity_min: Optional[float] = None,
    quantity_max: Optional[float] = None,
    supplier_ids: Optional[List[UUID]] = Query(None),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    sort_by: Optional[str] = 'created_at',
    sort_order: Optional[str] = 'desc',
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform advanced search and filtering on inventory items"""
    inventory_service = InventoryService(db)
    
    # Convert query parameters to tuples for price and quantity ranges
    price_range = (price_min, price_max) if price_min is not None or price_max is not None else None
    quantity_range = (quantity_min, quantity_max) if quantity_min is not None or quantity_max is not None else None
    date_range = (from_date, to_date) if from_date or to_date else None

    return inventory_service.advanced_inventory_search(
        search_term=search_term,
        inventory_type=inventory_type,
        status_list=status_list,
        price_range=price_range,
        quantity_range=quantity_range,
        supplier_ids=supplier_ids,
        date_range=date_range,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )

# Inventory Reporting Endpoints
@router.get("/reports/{report_type}", response_model=Dict)
@role_required(["supervisor"], 'inventories', 'read')
async def generate_inventory_report(
    report_type: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate different types of inventory reports"""
    inventory_service = InventoryService(db)
    return inventory_service.generate_inventory_report(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date
    )

# Transaction Endpoints
@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'inventories', 'create')
async def create_transaction(
    transaction: TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory transaction"""
    inventory_service = InventoryService(db)
    return inventory_service.process_transaction(transaction, current_user)

@router.get("/transactions", response_model=List[Dict])
@role_required(["supervisor"], 'inventories', 'read')
async def get_transactions(
    inventory_id: Optional[UUID] = Query(None),
    transaction_type: Optional[TransactionType] = None,
    inventory_type: Optional[InventoryType] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transactions with optional filtering"""
    inventory_service = InventoryService(db)
    return inventory_service.get_transactions(
        inventory_id=inventory_id,
        transaction_type=transaction_type,
        inventory_type=inventory_type,
        from_date=from_date,
        to_date=to_date
    )

# Additional Utility Endpoints
@router.put("/raw-materials/{inventory_id}", response_model=RawMaterialSchema)
@role_required(["manager"], 'inventories', 'update')
async def update_raw_material(
    inventory_id: UUID,
    inventory_update: RawMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing raw material inventory item"""
    inventory_service = InventoryService(db)
    return inventory_service.update_raw_material(inventory_id, inventory_update, current_user)


@router.put("/equipments/{inventory_id}", response_model=EquipmentSchema)
async def update_equipment(
    equipment_id: UUID,
    equipment_update: EquipmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    return service.update_equipment(equipment_id, equipment_update, current_user)


@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
@role_required(["admin"], 'inventories', 'delete')
async def delete_inventory(
    inventory_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an inventory item"""
    inventory_service = InventoryService(db)
    inventory_service.delete_inventory(inventory_id)
    return None


@router.patch("/{inventory_id}/toggle", response_model=bool)
@role_required(["manager"], 'inventories', 'update')
async def toggle_inventory(
    inventory_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_inventory = db.query(Inventory).get(inventory_id)
    
    if db_inventory.quantity > 0:
        raise HTTPException(status_code=400, detail="Cannot disable inventory with quantity")
    
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    return db_inventory.toggle_enabled(db)


@router.put("/transactions/{transaction_id}", response_model=Transaction)
@role_required(["supervisor"], 'inventories', 'update')
async def update_transaction(
    transaction_id: UUID,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing inventory transaction"""
    inventory_service = InventoryService(db)
    return inventory_service.update_transaction(transaction_id, transaction_update, current_user)


@router.get("/transactions/{inventory_id}", response_model=List[Dict])
@role_required(["supervisor"], 'inventories', 'read')
async def get_inventory_transactions(
    inventory_id: UUID,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transactions for a specific inventory item"""
    inventory_service = InventoryService(db)
    transactions = inventory_service.get_transactions_by_inventory(
        inventory_id=inventory_id,
        from_date=from_date,
        to_date=to_date
    )
    return transactions


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
@role_required(["admin"], 'inventories', 'delete')
async def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an inventory transaction"""
    inventory_service = InventoryService(db)
    inventory_service.delete_transaction(transaction_id)
    return None


@router.get("/inventory/reports", response_model=InventoryReportResponse)
@role_required(["supervisor"], 'inventories', 'read')
async def generate_inventory_report(
    report_type: str = Query(..., description="Type of report to generate (summary, low_stock, value, usage)"),
    start_date: Optional[date] = Query(None, description="Start date for the report range"),
    end_date: Optional[date] = Query(None, description="End date for the report range"),
    inventory_type: Optional[InventoryType] = Query(None, description="Filter by inventory type (RawMaterial, Equipment)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate an inventory report based on the specified type, date range, and inventory type.
    """
    inventory_service = InventoryService(db)
    
    try:
        report_data = inventory_service.generate_inventory_report(
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            inventory_type=inventory_type
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate report: {str(e)}"
        )

    return {
        "report_type": report_type,
        "start_date": start_date,
        "end_date": end_date,
        "inventory_type": inventory_type,
        "data": report_data
    }

#  department endpoints
@router.get("/departments", response_model=List[DepartmentSchema])
@role_required(["supervisor"], 'inventories', 'read')
async def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all departments"""
    inventory_service = InventoryService(db)
    departments = inventory_service.get_departments(skip=skip, limit=limit)
    return [DepartmentSchema.from_orm(department) for department in departments]


@router.get("/departments/{department_id}", response_model=Dict)
@role_required(["supervisor"], 'inventories', 'read')
async def get_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a department by ID"""
    inventory_service = InventoryService(db)
    return inventory_service.get_department(department_id)

@router.post("/departments", response_model=DepartmentSchema, status_code=status.HTTP_201_CREATED)
@role_required(["supervisor"], 'inventories', 'create')
async def create_department(
    department: DepartmentSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new department"""
    inventory_service = InventoryService(db)
    department = inventory_service.create_department(department.name, department.description)
    return DepartmentSchema.from_orm(department)


@router.put("/departments/{department_id}", response_model=DepartmentSchema)
@role_required(["supervisor"], 'inventories', 'update')
async def update_department(
    department_id: UUID,
    department: DepartmentSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing department"""
    inventory_service = InventoryService(db)
    return inventory_service.update_department(department_id, department.name, department.description)

@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
@role_required(["supervisor"], 'inventories', 'delete')
async def delete_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a department"""
    inventory_service = InventoryService(db)
    inventory_service.delete_department(department_id)
    return None