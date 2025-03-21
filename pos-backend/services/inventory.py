from typing import Optional, List, Dict, Tuple, Union
from uuid import UUID
from datetime import date, datetime
from sqlalchemy.orm import Session, aliased
from sqlalchemy import and_, func
from utils.time_utils import current_time

from models.inventory import (
    Inventory, 
    InventoryType, 
    InventoryStatus, 
    QuantityUnit, 
    RawMaterial, 
    Equipment, 
    InventoryTransaction, 
    TransactionType,
    Department
)
from models.supplier import Supplier
from models.user import User
from models.schemas.inventory import (
    RawMaterialCreate, 
    EquipmentCreate, 
    RawMaterialUpdate, 
    EquipmentUpdate,
    TransactionCreate
)
from fastapi import HTTPException, status

class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def _validate_supplier(self, supplier_id: Optional[UUID]) -> None:
        """Validate if the supplier exists"""
        if supplier_id:
            supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
            if not supplier:
                raise HTTPException(status_code=404, detail="Supplier not found")

    def _check_unique_inventory_name(self, name: str, inventory_id: Optional[UUID] = None) -> None:
        """Check if inventory name is unique"""
        query = self.db.query(Inventory).filter(Inventory.name == name)
        if inventory_id:
            query = query.filter(Inventory.id != inventory_id)
        
        existing_inventory = query.first()
        if existing_inventory:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inventory item with this name already exists"
            )

    def create_inventory(self, inventory: Union[RawMaterialCreate, EquipmentCreate], inventory_class, current_user: User):
        """
        Generic method to create inventory items with automatic restock transaction
        
        Args:
            inventory: Inventory creation schema
            inventory_class: RawMaterial or Equipment class
            current_user: User creating the inventory
        
        Returns:
            Created inventory item
        """
        # Validate supplier
        self._validate_supplier(inventory.supplier_id)
        
        # Check unique name
        self._check_unique_inventory_name(inventory.name)
        
        # Create inventory
        db_inventory = inventory_class(
            **inventory.dict(), 
            created_at=datetime.now(), 
            updated_at=datetime.now()
        )
        
        self.db.add(db_inventory)
        self.db.commit()
        self.db.refresh(db_inventory)
        
        # Create automatic restock transaction
        initial_quantity = (
            inventory.quantity if isinstance(inventory, RawMaterialCreate) 
            else inventory.total_units if isinstance(inventory, EquipmentCreate)
            else 0
        )
        
        if initial_quantity > 0:
            # Create restock transaction
            transaction = InventoryTransaction(
                inventory_id=db_inventory.id,
                transaction_type=TransactionType.RESTOCK,
                quantity=initial_quantity,
                created_by_id=current_user.id,
                created_by=f'{current_user.first_name} {current_user.last_name}',
                notes="Initial inventory creation",
                is_system_generated=True
            )
            
            self.db.add(transaction)
            self.db.commit()
        
        return db_inventory
        
    def create_raw_material(self, inventory: RawMaterialCreate, current_user: User) -> RawMaterial:
        return self.create_inventory(inventory, RawMaterial, current_user)

    def create_equipment(self, inventory: EquipmentCreate, current_user: User) -> Equipment:
        return self.create_inventory(inventory, Equipment, current_user)
    
    def update_raw_material(self, inventory_id: UUID, inventory_update: RawMaterialUpdate, current_user: User) -> RawMaterial:
        """Update an existing raw material inventory item"""
        db_inventory = self.db.query(RawMaterial).get(inventory_id)
        if not db_inventory:
            raise HTTPException(status_code=404, detail="Raw material inventory not found")
        
        update_data = inventory_update.dict(exclude_unset=True)
        
        # Validate supplier if provided
        if 'supplier_id' in update_data:
            self._validate_supplier(update_data['supplier_id'])
        
        # Check unique name if provided
        if 'name' in update_data:
            self._check_unique_inventory_name(update_data['name'], inventory_id)
        
        # Track old quantity for transaction
        old_quantity = db_inventory.quantity
        
        # Update inventory
        for key, value in update_data.items():
            setattr(db_inventory, key, value)
        
        db_inventory.updated_at = datetime.now()
        
        self.db.add(db_inventory)
        self.db.commit()
        self.db.refresh(db_inventory)
        
        # Create transaction if quantity changed
        if 'quantity' in update_data and update_data['quantity'] != old_quantity:
            self._create_quantity_transaction(
                db_inventory, 
                old_quantity, 
                update_data['quantity'], 
                current_user
            )
        
        return db_inventory

    def update_equipment(self, equipment_id: UUID, equipment_update: EquipmentUpdate, current_user: User) -> Equipment:
        """Update an existing equipment inventory item"""
        db_equipment = self.db.query(Equipment).get(equipment_id)
        if not db_equipment:
            raise HTTPException(status_code=404, detail="Equipment inventory not found")
        
        update_data = equipment_update.dict(exclude_unset=True)
        
        # Validate supplier if provided
        if 'supplier_id' in update_data:
            self._validate_supplier(update_data['supplier_id'])
        
        # Check unique name if provided
        if 'name' in update_data:
            self._check_unique_inventory_name(update_data['name'], equipment_id)
        
        # Track old available units for transaction
        old_available_units = db_equipment.available_units
        
        # Update equipment
        for key, value in update_data.items():
            setattr(db_equipment, key, value)
        
        db_equipment.updated_at = datetime.now()
        
        self.db.add(db_equipment)
        self.db.commit()
        self.db.refresh(db_equipment)
        
        # Create transaction if available units changed
        if 'available_units' in update_data and update_data['available_units'] != old_available_units:
            self._create_quantity_transaction(
                db_equipment, 
                old_available_units, 
                update_data['available_units'], 
                current_user
            )
        
        return db_equipment

    def _create_quantity_transaction(self, inventory, old_quantity, new_quantity, current_user):
        """Create a transaction when quantity is updated"""
        quantity_change = new_quantity - old_quantity
        transaction_type = (
            TransactionType.RESTOCK if quantity_change > 0 
            else TransactionType.ISSUE
        )
        
        transaction = InventoryTransaction(
            inventory_id=inventory.id,
            transaction_type=transaction_type,
            quantity=abs(quantity_change),
            upated_by_id=current_user.id,
            notes=f"Quantity updated from {old_quantity} to {new_quantity}"
        )
        self.db.add(transaction)
        self.db.commit()

    def get_raw_materials(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        name: Optional[str] = None,
        status: Optional[InventoryStatus] = None,
        quantity_unit: Optional[QuantityUnit] = None,
        supplier_id: Optional[UUID] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> List[RawMaterial]:
        """Get filtered raw materials"""
        query = self.db.query(RawMaterial)
        
        filters = []
        if name:
            filters.append(RawMaterial.name.ilike(f"%{name}%"))
        if status:
            filters.append(RawMaterial.status == status)
        if quantity_unit:
            filters.append(RawMaterial.quantity_unit == quantity_unit)
        if supplier_id:
            filters.append(RawMaterial.supplier_id == supplier_id)
        if price_min is not None:
            filters.append(RawMaterial.price_per_unit >= price_min)
        if price_max is not None:
            filters.append(RawMaterial.price_per_unit <= price_max)
        if from_date:
            filters.append(RawMaterial.created_at >= from_date)
        if to_date:
            filters.append(RawMaterial.created_at <= to_date)
        
        if filters:
            query = query.filter(and_(*filters))
        
        return query.offset(skip).limit(limit).all()
    
    def get_equipment(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        name: Optional[str] = None,
        status: Optional[InventoryStatus] = None,
        supplier_id: Optional[UUID] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> List[Equipment]:
        """Get filtered equipment inventory items"""
        query = self.db.query(Equipment)
        
        filters = []
        if name:
            filters.append(Equipment.name.ilike(f"%{name}%"))
        if status:
            filters.append(Equipment.status == status)
        if supplier_id:
            filters.append(Equipment.supplier_id == supplier_id)
        if price_min is not None:
            filters.append(Equipment.price_per_unit >= price_min)
        if price_max is not None:
            filters.append(Equipment.price_per_unit <= price_max)
        if from_date:
            filters.append(Equipment.created_at >= from_date)
        if to_date:
            filters.append(Equipment.created_at <= to_date)
        
        if filters:
            query = query.filter(and_(*filters))
        
        return query.offset(skip).limit(limit).all()

    def delete_inventory(self, inventory_id: UUID) -> None:
        """Delete an inventory item"""
        db_inventory = self.db.query(Inventory).get(inventory_id)
        if not db_inventory:
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        # Check for related transactions
        transactions = self.db.query(InventoryTransaction).filter(
            InventoryTransaction.inventory_id == inventory_id
        ).all()
        
        if transactions:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete inventory with existing transactions."
            )
        
        self.db.delete(db_inventory)
        self.db.commit()

    def process_transaction(
        self,
        transaction: TransactionCreate,
        current_user: User
    ) -> InventoryTransaction:
        """
        Process a new inventory transaction with comprehensive validation and status management
        
        Args:
            transaction: Transaction details
            current_user: User performing the transaction
        
        Returns:
            Created inventory transaction
        
        Raises:
            HTTPException: If the inventory item does not exist or if the transaction is invalid
        """
        # Validate inventory exists
        inventory = self.db.query(Inventory).get(transaction.inventory_id)
        if not inventory:
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        # Validate transaction quantity
        if transaction.quantity <= 0:
            raise HTTPException(status_code=400, detail="Transaction quantity must be positive")
        
        # Store previous status and quantity
        previous_status = inventory.status
        previous_quantity = inventory.quantity
        
        # Process transaction based on type
        try:
            if transaction.transaction_type == TransactionType.ISSUE:
                self._process_issue_transaction(inventory, transaction)
                resulting_quantity = previous_quantity - transaction.quantity
            elif transaction.transaction_type == TransactionType.RESTOCK:
                self._process_restock_transaction(inventory, transaction)
                resulting_quantity = previous_quantity + transaction.quantity
            elif transaction.transaction_type == TransactionType.RETURN:
                self._process_return_transaction(inventory, transaction)
                resulting_quantity = previous_quantity + transaction.quantity
            elif transaction.transaction_type == TransactionType.WRITE_OFF:
                self._process_write_off_transaction(inventory, transaction)
                resulting_quantity = previous_quantity - transaction.quantity
            elif transaction.transaction_type == TransactionType.DAMAGE:
                self._process_damage_transaction(inventory, transaction)
                resulting_quantity = previous_quantity - transaction.quantity
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported transaction type: {transaction.transaction_type}"
                )
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        # Create transaction record with missing values
        db_transaction = InventoryTransaction(
            inventory_id=transaction.inventory_id,
            transaction_type=transaction.transaction_type,
            quantity=transaction.quantity,
            previous_status=previous_status,
            previous_quantity=previous_quantity,
            resulting_quantity=resulting_quantity,
            updated_by_id=current_user.id,
            created_by_id=current_user.id, 
            notes=transaction.notes,
            department_id=transaction.department_id,
        )
        
        # Update and commit
        try:
            self.db.add(inventory)
            self.db.add(db_transaction)
            self.db.commit()
            self.db.refresh(db_transaction)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to process transaction {str(e)}")
        
        return db_transaction

    def _process_issue_transaction(self, inventory, transaction):
        """Process an issue transaction"""
        if isinstance(inventory, RawMaterial):
            if inventory.quantity < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Not enough raw material inventory available"
                )
            inventory.quantity -= transaction.quantity
            if inventory.quantity <= 0:
                inventory.status = InventoryStatus.DEPLETED
            elif inventory.quantity <= inventory.critical_threshold:
                inventory.status = InventoryStatus.LOW_STOCK
        
        elif isinstance(inventory, Equipment):
            if inventory.available_units < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Not enough equipment units available"
                )
            inventory.available_units -= int(transaction.quantity)
            if inventory.available_units == 0:
                inventory.status = InventoryStatus.ISSUED

    def _process_restock_transaction(self, inventory, transaction):
        """Process a restock transaction"""
        if isinstance(inventory, RawMaterial):
            # Add restocked quantity
            inventory.quantity += transaction.quantity
            
            # Update status
            inventory.status = InventoryStatus.IN_STOCK
            
            # Optionally, check if the quantity is now above low stock threshold
            if inventory.quantity > inventory.critical_threshold:
                inventory.status = InventoryStatus.IN_STOCK
        
        elif isinstance(inventory, Equipment):
            # Add restocked units
            added_units = int(transaction.quantity)
            inventory.total_units += added_units
            inventory.available_units += added_units
            
            # Update status
            inventory.status = InventoryStatus.IN_STOCK

    def _process_return_transaction(self, inventory, transaction):
        """
        Process a return transaction for both raw materials and equipment
        Ensures returns do not exceed issued quantities
        """
        # Calculate total issued and returned quantities
        issued_quantity = self._get_net_issued_quantity(inventory)
        
        # Validate return quantity
        if transaction.quantity > issued_quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot return more than what was issued. Maximum returnable quantity is {issued_quantity}."
            )
        
        if isinstance(inventory, RawMaterial):
            # For raw materials, simply add back to quantity
            inventory.quantity += transaction.quantity
            
            # Update status
            inventory.status = InventoryStatus.IN_STOCK
        
        elif isinstance(inventory, Equipment):
            # For equipment, update available and total units
            if inventory.total_units - inventory.available_units < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot return more units than were issued"
                )
            
            inventory.available_units += int(transaction.quantity)
            
            # Update status
            if inventory.available_units == inventory.total_units:
                inventory.status = InventoryStatus.RETURNED
            else:
                inventory.status = InventoryStatus.IN_STOCK

    def _process_write_off_transaction(self, inventory, transaction):
        """Process a write-off transaction"""
        if isinstance(inventory, RawMaterial):
            if inventory.quantity < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot write off more than available raw material quantity"
                )
            
            inventory.quantity -= transaction.quantity
            
            # Update status
            if inventory.quantity <= 0:
                inventory.status = InventoryStatus.DEPLETED
        
        elif isinstance(inventory, Equipment):
            if inventory.available_units < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot write off more than available equipment units"
                )
            
            inventory.available_units -= int(transaction.quantity)
            
            # Update status
            if inventory.available_units == 0:
                inventory.status = InventoryStatus.DEPLETED

    def _process_damage_transaction(self, inventory, transaction):
        """Process a damage transaction"""
        if isinstance(inventory, RawMaterial):
            if inventory.quantity < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot mark as damaged more than available raw material quantity"
                )
            
            inventory.quantity -= transaction.quantity
            inventory.status = InventoryStatus.DAMAGED
        
        elif isinstance(inventory, Equipment):
            if inventory.available_units < transaction.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot mark as damaged more than available equipment units"
                )
            
            inventory.available_units -= int(transaction.quantity)
            inventory.status = InventoryStatus.DAMAGED

    def _get_net_issued_quantity(self, inventory):
        """
        Calculate the net issued quantity for an inventory item
        
        Calculates total issued quantity minus total returned quantity
        """
        # Query issued transactions
        issued_quantity = self.db.query(func.sum(InventoryTransaction.quantity)).filter(
            InventoryTransaction.inventory_id == inventory.id,
            InventoryTransaction.transaction_type == TransactionType.ISSUE
        ).scalar() or 0
        
        # Query returned transactions
        returned_quantity = self.db.query(func.sum(InventoryTransaction.quantity)).filter(
            InventoryTransaction.inventory_id == inventory.id,
            InventoryTransaction.transaction_type == TransactionType.RETURN
        ).scalar() or 0
        
        # Calculate net issued quantity
        return issued_quantity - returned_quantity

    def get_transactions(
        self, 
        inventory_id: Optional[UUID] = None,
        transaction_type: Optional[TransactionType] = None,
        inventory_type: Optional[InventoryType] = None,
        department_id: Optional[UUID] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ):
        """Get filtered transactions"""
        query = self.db.query(
            InventoryTransaction,
            Inventory.inventory_type,
            Inventory.name.label("inventory_name"),
            Department.name.label('department'),
            User.first_name.label("created_by_first_name"),
            User.last_name.label("created_by_last_name"),
            User.first_name.label("updated_by_first_name"),
            User.last_name.label("updated_by_last_name")
        ).join(
            Inventory, InventoryTransaction.inventory_id == Inventory.id
        ).join(
            User, InventoryTransaction.created_by_id == User.id
        ).join(
            Department, InventoryTransaction.department_id == Department.id
        )
    
        if inventory_type:
            query = query.filter(Inventory.inventory_type == inventory_type)
    
        if inventory_id:
            query = query.filter(InventoryTransaction.inventory_id == inventory_id)
        
        if department_id:
            query = query.filter(Department.id == department_id)
        
        if transaction_type:
            query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    
        if from_date:
            query = query.filter(InventoryTransaction.transaction_date >= from_date)
    
        if to_date:
            query = query.filter(InventoryTransaction.transaction_date <= to_date)
        
        results = query.order_by(InventoryTransaction.transaction_date.desc()).all()
        
        # Convert the result tuples to TransactionDetail objects
        transactions = []
        for (
            transaction,
            inv_type,
            inv_name,
            department,
            created_by_first_name,
            created_by_last_name,
            updated_by_first_name,
            updated_by_last_name 
            ) in results:
            transaction_dict = {
                "id": transaction.id,
                "inventory_id": transaction.inventory_id,
                "transaction_type": transaction.transaction_type,
                "quantity": transaction.quantity,
                "transaction_date": transaction.transaction_date,
                "created_by_id": transaction.created_by_id,
                "updated_by_id": transaction.updated_by_id,
                "previous_status": transaction.previous_status,
                "previous_quantity": transaction.previous_quantity,
                "resulting_quantity": transaction.resulting_quantity,
                "notes": transaction.notes,
                "created_at": transaction.created_at,
                "updated_at": transaction.updated_at,
                "inventory_type": inv_type,
                "inventory_name": inv_name,
                "created_by": f"{created_by_first_name} {created_by_last_name}",
                "updated_by": f"{updated_by_first_name} {updated_by_last_name}" \
                                if updated_by_first_name and updated_by_last_name else None,
                "department_id": transaction.department_id,
                "department": department
            }
            transactions.append(transaction_dict)
        
        return transactions   

    def get_transactions_by_inventory(
        self,
        inventory_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> List[Dict]:
        """Get transactions by inventory with detailed information"""
        created_by_alias = aliased(User)
        updated_by_alias = aliased(User)

        query = self.db.query(
            InventoryTransaction.id,
            InventoryTransaction.transaction_date,
            InventoryTransaction.quantity,
            InventoryTransaction.previous_quantity,
            InventoryTransaction.previous_status,
            InventoryTransaction.resulting_quantity,
            InventoryTransaction.transaction_type,
            InventoryTransaction.notes,
            InventoryTransaction.created_at,
            InventoryTransaction.updated_at,
            InventoryTransaction.is_locked,
            InventoryTransaction.is_system_generated,
            InventoryTransaction.department_id,
            Department.name.label('department_name'),
            InventoryTransaction.inventory_id,
            Inventory.name.label('inventory_name'),
            Inventory.status.label('inventory_status'),
            created_by_alias.first_name.label('created_by_first_name'),
            created_by_alias.last_name.label('created_by_last_name'),
            updated_by_alias.first_name.label('updated_by_first_name'),
            updated_by_alias.last_name.label('updated_by_last_name')
        ).join(
            Inventory, InventoryTransaction.inventory_id == Inventory.id
        ).join(
            created_by_alias, InventoryTransaction.created_by_id == created_by_alias.id
        ).outerjoin(
            updated_by_alias, InventoryTransaction.updated_by_id == updated_by_alias.id
        ).outerjoin(
            Department, InventoryTransaction.department_id == Department.id
        ).filter(
            InventoryTransaction.inventory_id == inventory_id
        )

        if from_date:
            query = query.filter(InventoryTransaction.transaction_date >= from_date)

        if to_date:
            query = query.filter(InventoryTransaction.transaction_date <= to_date)

        results = query.order_by(InventoryTransaction.transaction_date.desc()).all()

        transactions = []
        for result in results:
            transaction_dict = {
                "id": result.id,
                "date": result.updated_at if result.updated_at else result.created_at,
                "quantity": result.quantity,
                "previous_quantity": result.previous_quantity,
                "previous_status": result.previous_status,
                "status": result.inventory_status,
                "created_by": f"{result.updated_by_first_name} {result.updated_by_last_name}" if result.updated_by_first_name and result.updated_by_last_name else f"{result.created_by_first_name} {result.created_by_last_name}",
                "department": result.department_name,
                "transaction_type": result.transaction_type,
                "notes": result.notes
            }
            transactions.append(transaction_dict)

        return transactions
    
    def advanced_inventory_search(
        self,
        search_term: Optional[str] = None,
        inventory_type: Optional[InventoryType] = None,
        status_list: Optional[List[InventoryStatus]] = None,
        price_range: Optional[Tuple[float, float]] = None,
        quantity_range: Optional[Tuple[float, float]] = None,
        supplier_ids: Optional[List[UUID]] = None,
        date_range: Optional[Tuple[date, date]] = None,
        sort_by: Optional[str] = 'created_at',
        sort_order: Optional[str] = 'desc',
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict]:
        """
        Advanced search and filtering for inventory items with comprehensive options
        
        Args:
            search_term: Fuzzy search across name, description
            inventory_type: Filter by inventory type (RawMaterial, Equipment)
            status_list: List of statuses to filter
            price_range: Tuple of (min_price, max_price)
            quantity_range: Tuple of (min_quantity, max_quantity)
            supplier_ids: List of supplier IDs to filter
            date_range: Tuple of (start_date, end_date)
            sort_by: Field to sort results
            sort_order: 'asc' or 'desc'
            skip: Pagination offset
            limit: Number of results
        
        Returns:
            List of inventory items with detailed information
        """
        from sqlalchemy import or_, func

        # Base query for joining inventory types
        query = self.db.query(
            Inventory, 
            Supplier.name.label('supplier_name')
        ).outerjoin(Supplier, Inventory.supplier_id == Supplier.id)

        # Filters
        filters = []

        # Fuzzy search across name and description
        if search_term:
            search_filter = or_(
                Inventory.name.ilike(f"%{search_term}%"),
                Inventory.description.ilike(f"%{search_term}%")
            )
            filters.append(search_filter)

        # Inventory type filter
        if inventory_type:
            filters.append(Inventory.inventory_type == inventory_type)

        # Status filter
        if status_list:
            filters.append(Inventory.status.in_(status_list))

        # Price range filter
        if price_range:
            min_price, max_price = price_range
            filters.append(Inventory.price_per_unit.between(min_price, max_price))

        # Quantity range filter
        if quantity_range:
            min_qty, max_qty = quantity_range
            filters.append(Inventory.quantity.between(min_qty, max_qty))

        # Supplier filter
        if supplier_ids:
            filters.append(Inventory.supplier_id.in_(supplier_ids))

        # Date range filter
        if date_range:
            start_date, end_date = date_range
            filters.append(Inventory.created_at.between(start_date, end_date))

        # Apply filters
        if filters:
            query = query.filter(and_(*filters))

        # Sorting
        sort_column = getattr(Inventory, sort_by, Inventory.created_at)
        if sort_order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        results = query.offset(skip).limit(limit).all()

        # Transform results
        inventory_list = []
        for inventory, supplier_name in results:
            inventory_dict = {
                **inventory.__dict__,
                'supplier_name': supplier_name,
                'inventory_type': type(inventory).__name__
            }
            # Remove SQLAlchemy internal keys
            inventory_dict.pop('_sa_instance_state', None)
            inventory_list.append(inventory_dict)

        return inventory_list

    def generate_inventory_report(
        self, 
        report_type: str = 'summary',
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        inventory_type: Optional[InventoryType] = None
    ) -> Dict:
        """
        Generate comprehensive inventory reports
        
        Args:
            report_type: Type of report ('summary', 'low_stock', 'value', 'usage')
            start_date: Start date for report range
            end_date: End date for report range
        
        Returns:
            Detailed report dictionary
        """
        # Default to current year if no dates provided
        if not start_date:
            start_date = date(datetime.now().year, 1, 1)
        if not end_date:
            end_date = datetime.now().date()

        reports = {
            'summary': self._summary_report(start_date, end_date, inventory_type),
            'low_stock': self._low_stock_report(inventory_type),
            'value': self._inventory_value_report(start_date, end_date, inventory_type),
            'usage': self._inventory_usage_report(start_date, end_date, inventory_type)
        }

        if report_type not in reports:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid report type. Choose from: {', '.join(reports.keys())}"
            )

        return reports[report_type]

    def _summary_report(
        self, 
        start_date: date, 
        end_date: date, 
        inventory_type: Optional[InventoryType] = None
    ) -> Dict:
        """Generate summary report of inventory"""
        # Base query
        query = self.db.query(Inventory)

        # Filter by inventory type if provided
        if inventory_type:
            query = query.filter(Inventory.inventory_type == inventory_type)

        # Total items
        total_items = query.count()

        # Items by type
        items_by_type_query = self.db.query(Inventory.inventory_type, func.count())
        if inventory_type:
            items_by_type_query = items_by_type_query.filter(Inventory.inventory_type == inventory_type)
        items_by_type = items_by_type_query.group_by(Inventory.inventory_type).all()

        # Transactions summary
        transactions_query = self.db.query(
            func.sum(InventoryTransaction.quantity),
            InventoryTransaction.transaction_type
        ).join(
            Inventory, InventoryTransaction.inventory_id == Inventory.id
        ).filter(
            InventoryTransaction.transaction_date.between(start_date, end_date)
        )
        if inventory_type:
            transactions_query = transactions_query.filter(Inventory.inventory_type == inventory_type)
        transactions = transactions_query.group_by(InventoryTransaction.transaction_type).all()

        return {
            'total_inventory_items': total_items,
            'items_by_type': dict(items_by_type),
            'transaction_summary': dict(transactions)
        }
    
    def _low_stock_report(
        self, 
        inventory_type: Optional[InventoryType] = None, 
        threshold: float = 0.2
    ) -> Dict:
        """Generate report of low stock inventory items"""
        query = self.db.query(Inventory).filter(
            Inventory.quantity / Inventory.max_quantity <= threshold
        )
        if inventory_type:
            query = query.filter(Inventory.inventory_type == inventory_type)

        low_stock_items = query.all()

        return {
            'low_stock_items': [
                {
                    'id': item.id,
                    'name': item.name,
                    'current_quantity': item.quantity,
                    'max_quantity': item.max_quantity,
                    'percentage': (item.quantity / item.max_quantity) * 100
                } for item in low_stock_items
            ]
        }

    def _inventory_value_report(
        self, 
        start_date: date, 
        end_date: date, 
        inventory_type: Optional[InventoryType] = None
    ) -> Dict:
        """Calculate total inventory value and value changes"""
        # Total inventory value
        total_value_query = self.db.query(func.sum(Inventory.quantity * Inventory.price_per_unit)).filter(
            Inventory.status != InventoryStatus.INACTIVE
        )
        if inventory_type:
            total_value_query = total_value_query.filter(Inventory.inventory_type == inventory_type)
        total_value = total_value_query.scalar() or 0

        # Value changes by transaction type
        value_changes_query = self.db.query(
            InventoryTransaction.transaction_type,
            func.sum(InventoryTransaction.quantity * Inventory.price_per_unit)
        ).join(
            Inventory, InventoryTransaction.inventory_id == Inventory.id
        ).filter(
            InventoryTransaction.transaction_date.between(start_date, end_date)
        )
        if inventory_type:
            value_changes_query = value_changes_query.filter(Inventory.inventory_type == inventory_type)
        value_changes = value_changes_query.group_by(InventoryTransaction.transaction_type).all()

        return {
            'total_inventory_value': total_value,
            'value_changes_by_transaction_type': dict(value_changes)
        }

    def _validate_transaction_lock(self, transaction: InventoryTransaction) -> None:
        """
        Validate if a transaction is locked and cannot be modified or deleted.

        Args:
            transaction: The transaction to validate.

        Raises:
            HTTPException: If the transaction is locked.
        """
        # Check if the transaction is explicitly locked
        if transaction.is_locked:
            raise HTTPException(
                status_code=400, 
                detail="This transaction is locked and cannot be modified or deleted."
            )

        # Check if the transaction is system-generated
        if transaction.is_system_generated:
            raise HTTPException(
                status_code=400, 
                detail="System-generated transactions cannot be modified or deleted."
            )

        # Check if the transaction is older than the allowed modification period (e.g., 30 days)
        if self._is_transaction_older_than_threshold(transaction.created_at, days=30):
            raise HTTPException(
                status_code=400, 
                detail="Transactions older than 30 days cannot be modified or deleted."
            )
        
        # Check if there are newer transactions for the same inventory
        newer_transactions = self.db.query(InventoryTransaction).filter(
            InventoryTransaction.inventory_id == transaction.inventory_id,
            InventoryTransaction.transaction_date > transaction.transaction_date
        ).all()
        
        if newer_transactions:
            raise HTTPException(
                status_code=400,
                detail="This transaction is locked because newer transactions exist. Delete newer transactions first."
            )

    def _is_transaction_older_than_threshold(self, created_at: datetime, days: int) -> bool:
        """
        Check if a transaction is older than a specified number of days.

        Args:
            created_at: The creation date of the transaction.
            days: The threshold in days.

        Returns:
            True if the transaction is older than the threshold, False otherwise.
        """
        current = current_time()
    
        # Make both datetimes timezone-consistent
        if created_at.tzinfo is None and current.tzinfo is not None:
            # If created_at is naive but current is aware, make created_at aware
            # Assume the naive datetime is in the same timezone as the system
            created_at = created_at.replace(tzinfo=current.tzinfo)
        elif current.tzinfo is None and created_at.tzinfo is not None:
            # If current is naive but created_at is aware, make current aware
            current = current.replace(tzinfo=created_at.tzinfo)
        
        return (current - created_at).days > days
    
    def update_transaction(self, transaction_id: UUID, transaction_update, current_user: User) -> InventoryTransaction:
        """
        Update an existing inventory transaction by reverting the original transaction
        and applying a new one.

        Args:
            transaction_id: The ID of the transaction to update.
            transaction_update: TransactionUpdate Pydantic model with fields to update.
            current_user: The user performing the update.

        Returns:
            The updated transaction.

        Raises:
            HTTPException: If the transaction does not exist or the update is invalid.
        """
        # Fetch the transaction
        db_transaction = self.db.query(InventoryTransaction).get(transaction_id)
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Validate if the transaction is locked
        self._validate_transaction_lock(db_transaction)
        
        # Convert Pydantic model to dictionary
        if hasattr(transaction_update, "dict"):
            update_data = transaction_update.dict(exclude_unset=True)
        else:
            update_data = transaction_update  # Assume it's already a dict
        
        # Validate updatable fields
        updatable_fields = ["quantity", "transaction_type", "notes", "department_id"]
        for field in update_data:
            if field not in updatable_fields:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot update field: {field}"
                )

        # Get the inventory to update
        inventory = self.db.query(Inventory).get(db_transaction.inventory_id)
        if not inventory:
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        # First, revert the effect of the original transaction
        # If we have previous_quantity and previous_status stored, use those
        if hasattr(db_transaction, 'previous_quantity') and db_transaction.previous_quantity is not None:
            # Restore the inventory to its state before this transaction
            inventory.quantity = db_transaction.previous_quantity
            
            if hasattr(db_transaction, 'previous_status') and db_transaction.previous_status is not None:
                inventory.status = db_transaction.previous_status
        else:
            # Traditional reversion based on transaction type
            self._revert_transaction_effect(db_transaction, inventory)
        
        # Create a new transaction object with the updated values
        updated_transaction = TransactionCreate(
            inventory_id=db_transaction.inventory_id,
            transaction_type=update_data.get('transaction_type', db_transaction.transaction_type),
            quantity=update_data.get('quantity', db_transaction.quantity),
            notes=update_data.get('notes', db_transaction.notes),
            department_id=update_data.get('department_id', db_transaction.department_id)
        )
        
        # Store current values before processing the new transaction
        previous_status = inventory.status
        previous_quantity = inventory.quantity
        
        # Process the new transaction effect
        try:
            if updated_transaction.transaction_type == TransactionType.ISSUE:
                self._process_issue_transaction(inventory, updated_transaction)
                resulting_quantity = previous_quantity - updated_transaction.quantity
            elif updated_transaction.transaction_type == TransactionType.RESTOCK:
                self._process_restock_transaction(inventory, updated_transaction)
                resulting_quantity = previous_quantity + updated_transaction.quantity
            elif updated_transaction.transaction_type == TransactionType.RETURN:
                self._process_return_transaction(inventory, updated_transaction)
                resulting_quantity = previous_quantity + updated_transaction.quantity
            elif updated_transaction.transaction_type == TransactionType.WRITE_OFF:
                self._process_write_off_transaction(inventory, updated_transaction)
                resulting_quantity = previous_quantity - updated_transaction.quantity
            elif updated_transaction.transaction_type == TransactionType.DAMAGE:
                self._process_damage_transaction(inventory, updated_transaction)
                resulting_quantity = previous_quantity - updated_transaction.quantity
            elif updated_transaction.transaction_type == TransactionType.MAINTENANCE:
                # Handle maintenance transaction (presumably just changes status)
                inventory.status = InventoryStatus.MAINTENANCE
                resulting_quantity = previous_quantity
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported transaction type: {updated_transaction.transaction_type}"
                )
        except HTTPException as e:
                # Restore original inventory state if processing fails
                inventory.quantity = db_transaction.previous_quantity
                inventory.status = db_transaction.previous_status
                raise e
            
        # Update the transaction with new values
        for field, value in update_data.items():
            setattr(db_transaction, field, value)
        
        # Update transaction metadata
        db_transaction.updated_at = current_time()
        db_transaction.updated_by_id = current_user.id
        db_transaction.resulting_quantity = resulting_quantity
        
        # Commit changes
        try:
            self.db.add(db_transaction)
            self.db.add(inventory)
            self.db.commit()
            self.db.refresh(db_transaction)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to update transaction: {str(e)}"
            )

        return db_transaction

    def _revert_transaction_effect(self, transaction, inventory):
        """
        Revert the effect of a transaction on inventory.
        Helper method used by update and delete.
        
        Args:
            transaction: The transaction to revert.
            inventory: The inventory object to update.
        """
        if transaction.transaction_type == TransactionType.RESTOCK:
            inventory.quantity -= transaction.quantity
        elif transaction.transaction_type == TransactionType.ISSUE:
            inventory.quantity += transaction.quantity
            # If it was issued, revert the status if applicable
            if inventory.status == InventoryStatus.ISSUED:
                inventory.status = InventoryStatus.IN_STOCK
        elif transaction.transaction_type == TransactionType.RETURN:
            inventory.quantity -= transaction.quantity
            if inventory.status == InventoryStatus.RETURNED:
                inventory.status = InventoryStatus.IN_STOCK
        elif transaction.transaction_type == TransactionType.DAMAGE:
            inventory.quantity += transaction.quantity
            if inventory.status == InventoryStatus.DAMAGED:
                inventory.status = InventoryStatus.IN_STOCK
        elif transaction.transaction_type == TransactionType.WRITE_OFF:
            inventory.quantity += transaction.quantity
            if inventory.status == InventoryStatus.DECOMMISSIONED:
                inventory.status = InventoryStatus.IN_STOCK
        elif transaction.transaction_type == TransactionType.MAINTENANCE:
            if inventory.status == InventoryStatus.MAINTENANCE:
                inventory.status = InventoryStatus.IN_STOCK
                
        # Update inventory status based on quantity
        if inventory.status not in [InventoryStatus.MAINTENANCE, InventoryStatus.DAMAGED, 
                                    InventoryStatus.EXPIRED, InventoryStatus.DECOMMISSIONED]:
            if inventory.quantity <= 0:
                inventory.status = InventoryStatus.DEPLETED
            elif inventory.quantity < inventory.reorder_point:
                inventory.status = InventoryStatus.LOW_STOCK
            else:
                inventory.status = InventoryStatus.IN_STOCK

    def delete_transaction(self, transaction_id: UUID) -> None:
        """
        Delete an inventory transaction and revert its effect on inventory.
        
        Args:
            transaction_id: The ID of the transaction to delete.
            
        Raises:
            HTTPException: If the transaction does not exist or cannot be deleted.
        """
        # Fetch the transaction
        db_transaction = self.db.query(InventoryTransaction).get(transaction_id)
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        # Validate that the transaction is not locked
        self._validate_transaction_lock(db_transaction)
        
        # Get the inventory
        inventory = self.db.query(Inventory).get(db_transaction.inventory_id)
        if not inventory:
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        # If we have previous_quantity and previous_status stored, use those
        if hasattr(db_transaction, 'previous_quantity') and db_transaction.previous_quantity is not None:
            # Restore the inventory to its state before this transaction
            inventory.quantity = db_transaction.previous_quantity
            
            if hasattr(db_transaction, 'previous_status') and db_transaction.previous_status is not None:
                inventory.status = db_transaction.previous_status
        else:
            # Traditional reversion based on transaction type
            self._revert_transaction_effect(db_transaction, inventory)
        
        # Delete the transaction
        try:
            self.db.delete(db_transaction)
            self.db.add(inventory)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete transaction: {str(e)}"
            )
            """
            Delete an inventory transaction and revert its effect on inventory.

            Args:
                transaction_id: The ID of the transaction to delete.

            Raises:
                HTTPException: If the transaction does not exist or cannot be deleted.
            """
            # Fetch the transaction
            db_transaction = self.db.query(InventoryTransaction).get(transaction_id)
            if not db_transaction:
                raise HTTPException(status_code=404, detail="Transaction not found")

            # Validate that the transaction is not locked
            self._validate_transaction_lock(db_transaction)
            
            # Get the inventory
            inventory = self.db.query(Inventory).get(db_transaction.inventory_id)
            if not inventory:
                raise HTTPException(status_code=404, detail="Inventory not found")
            
            # Revert the effect of this transaction on inventory
            if db_transaction.transaction_type == TransactionType.STOCK_IN:
                inventory.quantity -= db_transaction.quantity
            elif db_transaction.transaction_type == TransactionType.STOCK_OUT:
                inventory.quantity += db_transaction.quantity
            # Handle other transaction types if needed
            
            # Update inventory status based on the new quantity
            if inventory.quantity <= 0:
                inventory.status = InventoryStatus.OUT_OF_STOCK
            elif inventory.quantity < inventory.reorder_point:
                inventory.status = InventoryStatus.LOW_STOCK
            else:
                inventory.status = InventoryStatus.IN_STOCK
            
            # Delete the transaction
            try:
                self.db.delete(db_transaction)
                # Update inventory
                self.db.add(inventory)
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to delete transaction: {str(e)}"
                )

    def get_departments(self, skip: int = 0, limit: int = 100) -> List[Department]:
        """Get all departments"""
        return self.db.query(Department).offset(skip).limit(limit).all()
    
    def get_department(self, department_id: UUID) -> Department:
        """Get a department by ID"""
        department = self.db.query(Department).get(department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        return department

    def create_department(self, name: str, description: str) -> Department:
        """Create a new department"""
        department = Department(name=name, description=description)
        self.db.add(department)
        self.db.commit()
        self.db.refresh(department)
        return department
  
    def update_department(self, department_id: UUID, name: str, description: str) -> Dict:
        """Update an existing department"""
        department = self.get_department(department_id)
        department.name = name
        department.description = description
        self.db.add(department)
        self.db.commit()
        self.db.refresh(department)
        
        return {
            "id": str(department.id),
            "name": department.name,
            "description": department.description
        }

    
    def delete_department(self, department_id: UUID) -> None:
        """Delete a department"""
        department = self.get_department(department_id)
        self.db.delete(department)
        self.db.commit()