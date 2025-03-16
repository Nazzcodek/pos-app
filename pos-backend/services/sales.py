from sqlalchemy import func, desc, asc
from sqlalchemy.orm import joinedload
from models.engine.database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from models.schemas.sale import(
    SaleCreate,
    SaleSummary,
    SaleItemsSummary,
    SaleTableRow,
    SaleItemTableRow,
    SaleItemResponse,
    SaleResponse
    )
from uuid import UUID
from models.sale import Sale, SaleItem
from models.product import Product
from models.category import Category
from models.user import User, UserSession
from decimal import Decimal
from datetime import datetime, timedelta, time
from typing import Dict, List, Any, Optional, Union
from models.validation import PaginationParams, FilterParams
import pandas as pd
from io import StringIO, BytesIO
import csv
from fastapi.responses import StreamingResponse, FileResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from utils.time_utils import current_time
from services.sessionManager import SessionManager

class Sales:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_user_session(self, session_id: UUID) -> UserSession:
        user_session = self.db.query(UserSession).get(session_id)
        if not user_session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        return user_session

    def get_sale(self, sale_id: UUID) -> Sale:
        sale = self.db.query(Sale).options(joinedload(Sale.items).joinedload(SaleItem.product)).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail=f"Sale {sale_id} not found")
        return sale
    
    def create_sale(self, user_id: UUID, session_id: UUID, sale_data: SaleCreate) -> dict:
        total_amount = Decimal(0)
        sale_items = []

        sale = Sale(
            user_id=user_id,
            session_id=session_id,
            total_amount=total_amount,
            receipt_number=self._generate_receipt_number(),
            timestamp=current_time()
        )

        self.db.add(sale)
        self.db.flush()
        
        for item_data in sale_data.items:
            product = self.db.query(Product).get(item_data.product_id)
            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item_data.product_id} not found"
                )
            
            item_total = product.price * item_data.quantity
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=product.price,
                total_price=item_total
            )

            total_amount += item_total
            sale_items.append(sale_item)

        sale.total_amount = total_amount
        self.db.add_all(sale_items)
        self.db.commit()
        self.db.refresh(sale)

        # Convert sale items to response format
        response_items = [
            SaleItemResponse(
                id=item.id,
                sale_id=item.sale_id,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price
            ) for item in sale_items
        ]

        # Create and return the response
        response = SaleResponse(
            id=sale.id,
            user_id=sale.user_id,
            session_id=sale.session_id,
            total_amount=sale.total_amount,
            timestamp=sale.timestamp,
            receipt_number=sale.receipt_number,
            items=response_items
        )

        # Convert to dictionary for FastAPI serialization
        return response.model_dump()

    def update_sale(self, sale_id: UUID, sale_data: SaleCreate) -> Sale:
        """
        Update an existing sale with modified item quantities.
        Only allows changing quantities or removing items entirely.
        Cannot change prices or add new products not in the original sale.
        """
        sale = self.get_sale(sale_id)
        
        # Get current items as a dictionary for quick lookup
        current_items = {str(item.product_id): item for item in sale.items}
        
        # Track which items will be retained
        retained_item_ids = set()
        total_amount = Decimal(0)
        
        # Process updated items
        for item_data in sale_data.items:
            product_id_str = str(item_data.product_id)
            
            # Check if this product was in the original sale
            if product_id_str not in current_items:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot add new product {item_data.product_id} during update. Only quantity changes allowed."
                )
            
            current_item = current_items[product_id_str]
            
            # Only update quantity, keeping original unit price
            if item_data.quantity <= 0:
                # If quantity is zero or negative, this item will be removed
                continue
                
            # Update total price based on new quantity but keep original unit price
            new_total_price = current_item.unit_price * item_data.quantity
            
            # Update the item
            current_item.quantity = item_data.quantity
            current_item.total_price = new_total_price
            
            total_amount += new_total_price
            retained_item_ids.add(product_id_str)
        
        # Remove items that aren't in the updated data (quantity 0 or not included)
        for product_id_str, item in current_items.items():
            if product_id_str not in retained_item_ids:
                self.db.delete(item)
        
        # Update sale total amount
        sale.total_amount = total_amount
        
        self.db.commit()
        self.db.refresh(sale)
    
        return sale
    
    def delete_sale(self, sale_id: UUID) -> None:
        sale = self.get_sale(sale_id)
        self.db.delete(sale)
        self.db.commit()

    def apply_filters(self, query, filters: FilterParams):
        # If receipt_number is provided, ignore all other filters and only filter by receipt_number
        if filters.receipt_number:
            return query.filter(Sale.receipt_number == filters.receipt_number)
        
        # Otherwise, apply the other filters
        # Check if the query includes Sale table
        sale_included = True
        for entity in query.column_descriptions:
            if isinstance(entity['type'], type) and entity['type'].__name__ == 'Sale':
                sale_included = True
                break
        
        # Apply filters appropriate to the query structure
        if filters.min_amount is not None and sale_included:
            query = query.filter(Sale.total_amount >= filters.min_amount)
        if filters.max_amount is not None and sale_included:
            query = query.filter(Sale.total_amount <= filters.max_amount)
        if filters.categories:
            # Make sure necessary joins exist
            if 'Category' not in str(query):
                query = query.join(Product, SaleItem.product_id == Product.id, isouter=True)\
                            .join(Category, Product.category_id == Category.id, isouter=True)
            query = query.filter(Category.name.in_(filters.categories))
        if filters.products:
            # Make sure necessary joins exist
            if 'Product' not in str(query):
                query = query.join(Product, SaleItem.product_id == Product.id, isouter=True)
            query = query.filter(Product.name.in_(filters.products))
        
        # Add group by handling with proper joins
        if filters.group_by:
            group_fields = []
            # Ensure necessary joins exist for each group field
            if 'product' in filters.group_by:
                if 'Product' not in str(query):
                    query = query.join(Product, SaleItem.product_id == Product.id, isouter=True)
                group_fields.append(Product.name)
            if 'category' in filters.group_by:
                if 'Category' not in str(query):
                    query = query.join(Product, SaleItem.product_id == Product.id, isouter=True)\
                                .join(Category, Product.category_id == Category.id, isouter=True)
                group_fields.append(Category.name)
            if 'user' in filters.group_by:
                if 'User' not in str(query):
                    query = query.join(Sale, SaleItem.sale_id == Sale.id, isouter=True)\
                                .join(User, Sale.user_id == User.id, isouter=True)
                group_fields.append(User.username)
            if 'session' in filters.group_by:
                if 'UserSession' not in str(query):
                    query = query.join(Sale, SaleItem.sale_id == Sale.id, isouter=True)\
                                .join(UserSession, Sale.session_id == UserSession.id, isouter=True)
                group_fields.append(UserSession.id)
            
            if group_fields:
                query = query.group_by(*group_fields)
        
        return query

    def apply_pagination(self, query, pagination: PaginationParams):
        # Check if we have a column to sort by
        if pagination.sort_by:
            # Determine which model contains the sort column
            column_found = False
            
            # Try to find the column in the Sale model
            if hasattr(Sale, pagination.sort_by):
                sort_column = getattr(Sale, pagination.sort_by)
                column_found = True
            # Try Product model
            elif hasattr(Product, pagination.sort_by):
                sort_column = getattr(Product, pagination.sort_by)
                column_found = True
            # Try SaleItem model    
            elif hasattr(SaleItem, pagination.sort_by):
                sort_column = getattr(SaleItem, pagination.sort_by)
                column_found = True
            # Try User model
            elif hasattr(User, pagination.sort_by):
                sort_column = getattr(User, pagination.sort_by)
                column_found = True
            # Try Category model
            elif hasattr(Category, pagination.sort_by):
                sort_column = getattr(Category, pagination.sort_by)
                column_found = True
            
            # Apply sorting if column was found
            if column_found:
                if pagination.sort_order == 'desc':
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column)
                    
        return query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)

    def get_sales_report(
        self, 
        start_date: datetime, 
        end_date: datetime,
        pagination: Optional[PaginationParams] = None,
        filters: Optional[FilterParams] = None,
        session_id: Optional[UUID] = None
    ) -> SaleSummary:
        
        if isinstance(end_date, datetime) and end_date.time() == time.min:
            end_date = datetime.combine(end_date.date(), time.max)
        
        # Create a base query for the detailed rows - notice we're only selecting sale-level fields
        query = (
            self.db.query(
                Sale.id,
                User.username,
                Sale.timestamp,
                Sale.total_amount,
                Sale.receipt_number,
                UserSession.login_time,
                UserSession.logout_time,
                func.sum(SaleItem.quantity).label("total_items")
            )
            .join(User, User.id == Sale.user_id)
            .join(SaleItem, SaleItem.sale_id == Sale.id)
            .join(UserSession, UserSession.id == Sale.session_id)
            .filter(Sale.timestamp >= start_date, Sale.timestamp <= end_date)
            .group_by(
                Sale.id, User.username, Sale.timestamp, 
                Sale.total_amount, Sale.receipt_number,
                UserSession.login_time, UserSession.logout_time
            )
            .order_by(desc(Sale.timestamp))
        )

        # Create a copy of the base query for count before applying filters
        count_query = (
            self.db.query(func.count(func.distinct(Sale.id)))
            .filter(Sale.timestamp >= start_date, Sale.timestamp <= end_date)
        )

        # Apply session filter if provided
        if session_id:
            query = query.filter(Sale.session_id == session_id)
            count_query = count_query.filter(Sale.session_id == session_id)

        # Apply filters to both queries
        if filters:
            if filters.receipt_number:
                query = query.filter(Sale.receipt_number == filters.receipt_number)
            if filters.min_amount is not None:
                query = query.filter(Sale.total_amount >= filters.min_amount)
            if filters.max_amount is not None:
                query = query.filter(Sale.total_amount <= filters.max_amount)
            count_query = self.apply_filters(count_query, filters)

        # Get the total count with filters applied
        total_count = count_query.scalar()

        # Apply pagination to the main query
        if pagination:
            query = self.apply_pagination(query, pagination)

        # Get the results and convert to response format
        rows = [
            SaleTableRow(
                sale_id=row.id,
                date_time=row.timestamp,
                total=row.total_amount,
                receipt_number=row.receipt_number,
                username=row.username,
                total_items=row.total_items,
                session_start=row.login_time,
                session_end=row.logout_time or current_time()
            )
            for row in query.all()
        ]

        # Calculate summary data
        summary = {
            "total_sales": total_count,
            "total_amount": sum(row.total for row in rows) if rows else Decimal(0),
            "total_items": sum(row.total_items for row in rows) if rows else 0,
            "sales_by_user": self._group_sales_by_user(rows)
        }

        return SaleSummary(
            rows=rows, 
            summary=summary,
            page=pagination.page if pagination else 1,
            page_size=pagination.page_size if pagination else len(rows)
    )
    
    def get_sales_items_report(
        self, 
        start_date: datetime, 
        end_date: datetime,
        pagination: Optional[PaginationParams] = None,
        filters: Optional[FilterParams] = None
    ) -> SaleItemsSummary:
        # Ensure end_date includes the full day
        if isinstance(end_date, datetime) and end_date.time() == time.min:
            end_date = datetime.combine(end_date.date(), time.max)
            
        # Build query for item-level data
        query = (
            self.db.query(
                Product.id.label('product_id'),
                Product.name.label('product'),
                Category.name.label('category'),
                func.sum(SaleItem.quantity).label('quantity'),
                SaleItem.unit_price.label('unit_price'),
                func.sum(SaleItem.total_price).label('total'),
                # Get first seller for each product
                func.min(User.username).label('username'),
                # Get first sale time for each product
                func.min(Sale.timestamp).label('date_time'),
                # Get first session for each product
                func.min(UserSession.login_time).label('session_start')
            )
            .join(Sale, Sale.id == SaleItem.sale_id)
            .join(User, User.id == Sale.user_id)
            .join(Product, Product.id == SaleItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .join(UserSession, UserSession.id == Sale.session_id)
            .filter(Sale.timestamp >= start_date, Sale.timestamp <= end_date)
            .group_by(Product.id, Product.name, Category.name, SaleItem.unit_price)
            .order_by(asc('product'))
        )
        # Create a copy for count before applying filters
        count_query = (
            self.db.query(func.count(func.distinct(Product.id)))
            .join(SaleItem, SaleItem.product_id == Product.id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .filter(Sale.timestamp.between(start_date, end_date))
        )

        # Apply filters with safe handling for the item-focused query
        if filters:
            query = self.apply_filters(query, filters)
            count_query = self.apply_filters(count_query, filters)
        
        # Get total count with filters
        total_items = count_query.scalar() or 0
        
        # Apply pagination if provided
        if pagination:
            query = self.apply_pagination(query, pagination)
        
        # Convert query results to response objects
        rows = [
            SaleItemTableRow(
                product_id=row.product_id,
                date_time=row.date_time,
                username=row.username,
                product=row.product,
                category=row.category,
                quantity=row.quantity,
                unit_price=row.unit_price,
                total=row.total,
                session_start=row.session_start
            )
            for row in query.all()
        ]

        # Generate summary data
        summary = {
            "total_items": total_items,
            "total_amount": sum(row.total for row in rows) if rows else Decimal(0),
            "items_by_product": self._group_items_by_product(rows),
            "items_by_category": self._group_items_by_category(rows),
            "items_by_user": self._group_items_by_user(rows),
        }

        return SaleItemsSummary(
            rows=rows, 
            summary=summary,
            page=pagination.page if pagination else 1,
            page_size=pagination.page_size if pagination else len(rows)
        )
    
    def _group_sales_by_user(self, rows: List[SaleTableRow]) -> Dict[str, Dict[str, Any]]:
        user_sales = {}
        for row in rows:
            if row.username not in user_sales:
                user_sales[row.username] = {
                    "total_sales": 0,
                    "total_amount": Decimal(0),
                    "total_items": 0
                }
            user_sales[row.username]["total_sales"] += 1
            user_sales[row.username]["total_amount"] += row.total
            user_sales[row.username]["total_items"] += row.total_items
        return user_sales

    def _group_items_by_product(self, rows: List[SaleItemTableRow]) -> Dict[str, Dict[str, Any]]:
        product_sales = {}
        for row in rows:
            if row.product not in product_sales:
                product_sales[row.product] = {
                    "quantity": 0,
                    "total_amount": Decimal(0),
                    "category": row.category
                }
            product_sales[row.product]["quantity"] += row.quantity
            product_sales[row.product]["total_amount"] += row.total
        return product_sales
    
    def _group_items_by_category(self, rows: List[SaleItemTableRow]) -> Dict[str, Dict[str, Any]]:
        category_sales = {}
        for row in rows:
            if row.category not in category_sales:
                category_sales[row.category] = {
                    "quantity": 0,
                    "total_amount": Decimal(0)
                }
            category_sales[row.category]["quantity"] += row.quantity
            category_sales[row.category]["total_amount"] += row.total
        return category_sales

    def _group_items_by_user(self, rows: List[SaleItemTableRow]) -> Dict[str, Dict[str, Any]]:
        user_sales = {}
        for row in rows:
            if row.username not in user_sales:
                user_sales[row.username] = {
                    "quantity": 0,
                    "total_amount": Decimal(0),
                    "products_sold": set()
                }
            user_sales[row.username]["quantity"] += row.quantity
            user_sales[row.username]["total_amount"] += row.total
            user_sales[row.username]["products_sold"].add(row.product)
        
        # Convert sets to lengths for JSON serialization
        for user in user_sales:
            user_sales[user]["unique_products"] = len(user_sales[user]["products_sold"])
            del user_sales[user]["products_sold"]
        
        return user_sales
    
    def _generate_receipt_number(self) -> str:
        timestamp = current_time().strftime('%Y%m%d%H%M%S')
        return f"RCPT-{timestamp}"
    
    def generate_receipt(self, sale_id: UUID) -> Dict[str, Any]:
        """
        Generate a receipt with session information
        """
        sale = self.db.query(Sale).get(sale_id)
        if not sale:
            raise HTTPException(
                status_code=404,
                detail="Sale not found"
                )
            
        receipt_data = {
            "receipt_number": sale.receipt_number,
            "date_time": sale.timestamp,
            "session_start": sale.session.login_time,
            "current_time": current_time(),
            "cashier": sale.user.username,
            "items": [
                {
                    "product": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total": item.total_price
                }
                for item in sale.items
            ],
            "total_amount": sale.total_amount
        }
        
        return receipt_data
    
    def get_current_session_report(self, user_id: UUID, report_type: str = 'sales') -> Union[SaleSummary, SaleItemsSummary]:
        """
        Generate a sales report for the current user session
        """
        session_manager = SessionManager(self.db)
        active_session = session_manager.get_active_session(user_id)
        
        if not active_session:
            raise HTTPException(
                status_code=404,
                detail=f"Active sessions not found"
            )
        
        end_time = active_session.logout_time or current_time()

        # Return appropriate report type
        if report_type == "sales":
            return self.get_sales_report(active_session.login_time, end_time)
        elif report_type == "items":
            return self.get_sales_items_report(active_session.login_time, end_time)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid report type: {report_type}. Must be 'sales' or 'items'."
            )

    def get_user_session_report(self, user_id: UUID, report_type: str = 'sales') -> Union[SaleSummary, SaleItemsSummary]:
        """
        Generate a sales report for the current user session
        """
        session_manager = SessionManager(self.db)
        active_session = session_manager.get_active_session(user_id)
        
        if not active_session:
            raise HTTPException(
                status_code=404,
                detail=f"Active session not found for user {user_id}"
            )
        
        end_time = active_session.logout_time or current_time()

        # Return appropriate report type
        if report_type == "sales":
            return self.get_sales_report(
                active_session.login_time,
                end_time,
                session_id=active_session.id
                )
        elif report_type == "items":
            return self.get_sales_items_report(
                active_session.login_time,
                end_time,
                session_id=active_session.id
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid report type: {report_type}. Must be 'sales' or 'items'."
            )


    def get_weekly_sales_report(self, date: datetime, report_type: str = 'sales') -> Dict:
        """
        Get a report for a calendar week (Sunday-Saturday) containing the given date
        """
        weekday = date.weekday()
        days_from_sunday = weekday + 1 if weekday < 6 else 0  
        start_date = datetime.combine(date - timedelta(days=days_from_sunday), time.min)
        
        # End date is Saturday at the end of day
        end_date = datetime.combine(start_date.date() + timedelta(days=6), time.max)
        
        # Get daily sales for the week
        daily_sales = []
        for i in range(7):
            day_start = start_date + timedelta(days=i)
            day_end = datetime.combine(day_start.date(), time.max)
            daily_report = self.get_daily_sales_report(day_start, report_type)
            daily_sales.append(daily_report)
        
        # Get total sales for the week
        total_sales = sum(day["total_sales"] for day in daily_sales)
        
        return {
            "total_sales": total_sales,
            "daily_sales": daily_sales
        }
    
    def get_monthly_sales_report(self, year: int, month: int, report_type: str = 'sales') -> Dict:
        """
        Get a report for an entire month
        """
        start_date = datetime.combine(datetime(year, month, 1), time.min)
        
        # Get end date (first day of next month or first day of next year if December)
        if month == 12:
            end_date = datetime.combine(datetime(year + 1, 1, 1) - timedelta(days=1), time.max)
        else:
            end_date = datetime.combine(datetime(year, month + 1, 1) - timedelta(days=1), time.max)
        
        # Get daily sales for the month
        daily_sales = []
        current_date = start_date
        while current_date <= end_date:
            daily_report = self.get_daily_sales_report(current_date, report_type)
            daily_sales.append(daily_report)
            current_date += timedelta(days=1)
        
        # Get weekly sales for the month
        weekly_sales = []
        current_date = start_date
        week_number = 1
        while current_date <= end_date:
            week_start = current_date
            week_end = week_start + timedelta(days=6)
            if week_end > end_date:
                week_end = end_date
            weekly_report = self.get_weekly_sales_report(week_start, report_type)
            weekly_sales.append({"week_no": week_number, "total_sales": weekly_report["total_sales"], "daily_sales": weekly_report["daily_sales"]})
            current_date = week_end + timedelta(days=1)
            week_number += 1
        
        # Get total sales for the month
        total_sales = sum(week["total_sales"] for week in weekly_sales)
        
        return {
            "total_sales": total_sales,
            "daily_sales": daily_sales,
            "weekly_sales": weekly_sales
        }
        
    def get_daily_sales_report(self, date: datetime, report_type: str = 'sales') -> Dict:
        """
        Get a report for a specific day
        """
        start = datetime.combine(date, time.min)
        end = datetime.combine(date, time.max)
        
        # Return appropriate report type
        if report_type == "sales":
            total_sales = self.get_sales_report(start, end).summary["total_amount"]
        elif report_type == "items":
            total_sales = self.get_sales_items_report(start, end).summary["total_amount"]
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid report type: {report_type}. Must be 'sales' or 'items'."
            )
        return {
            "date": date,
            "total_sales": total_sales
        }

    def get_hourly_sales_report(self, date: datetime, hour: int, report_type: str = 'sales') -> Dict:
        """
        Get a report for a specific hour of a day
        """
        start = datetime.combine(date, time(hour=hour))
        end = start + timedelta(hours=1) - timedelta(microseconds=1)
        
        # Return appropriate report type
        if report_type == "sales":
            total_sales = self.get_sales_report(start, end).summary['total_amount']
        elif report_type == "items":
            total_sales = self.get_sales_items_report(start, end).summary['total_amount']
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid report type: {report_type}. Must be 'sales' or 'items'."
            )
        
        return {
            "date": date,
            "hour": hour,
            "total_sales": total_sales
        }
    

class SalesExport:
    def __init__(self):
        self.supported_formats = {"csv", "pdf", "excel"}

    async def process_export_data(
        self,
        data: Dict[str, Any],
        visible_columns: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Process and filter export data based on visible columns"""
        if not data or "rows" not in data:
            return []

        rows = data.get("rows", [])
        if not isinstance(rows, list):
            return []

        
        # If no visible_columns specified, use all available columns from first row
        if not rows:
            return []
            
        if visible_columns is None:
            visible_columns = list(rows[0].keys()) if rows and isinstance(rows[0], dict) else []

        # Filter data based on visible columns
        filtered_data = [
            {key: value for key, value in row.items() if key in visible_columns}
            for row in rows if isinstance(row, dict)
        ]


        # Calculate totals for numeric columns
        numeric_columns = {'quantity', 'total'} & set(visible_columns)
        if numeric_columns:
            totals = {
                col: sum(row.get(col, 0) for row in filtered_data)
                for col in numeric_columns
            }
            
            # Append total row
            total_row = {key: '' for key in visible_columns}
            total_row.update(totals)
            total_row['username'] = 'Totals'
            filtered_data.append(total_row)

        return filtered_data

    def generate_filename(self, format: str, start_date: datetime, end_date: datetime) -> str:
        """Generate standardized filename for exports"""
        return f"sales_report_{start_date}_{end_date}.{format}"

    async def export_data(
        self,
        format: str,
        data: Dict[str, Any],
        start_date: datetime,
        end_date: datetime,
        visible_columns: Optional[List[str]] = None
    ) -> StreamingResponse | FileResponse:
        """Main export method that handles all export formats"""
        if format not in self.supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format. Supported formats: {', '.join(self.supported_formats)}"
            )

        processed_data = await self.process_export_data(data, visible_columns)
        if not processed_data:
            raise HTTPException(
                status_code=404,
                detail="No data available for export"
            )

        filename = self.generate_filename(format, start_date, end_date)
        
        export_methods = {
            "csv": self.export_to_csv,
            "pdf": self.export_to_pdf,
            "excel": self.generate_excel_report
        }
        
        return await export_methods[format](processed_data, filename)

    async def export_to_csv(self, data: List[dict], filename: str) -> StreamingResponse:
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    async def export_to_pdf(self, data: List[dict], filename: str) -> StreamingResponse:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=20, bottomMargin=20)
        elements = []
        
        # Title
        title = [["Sales Report"]]
        title_table = Table(title)
        title_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 16),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(title_table)
        elements.append(Spacer(1, 6))
        
        # Table Headers
        headers = list(data[0].keys())
        col_widths = [max(80, len(header) * 7) for header in headers]  # Adjust column width dynamically
        table_data = [headers] + [[row[key].strftime('%Y-%m-%d %H:%M') if isinstance(row[key], datetime) else row[key] for key in headers] for row in data]
        
        # Table Styling
        table = Table(table_data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    async def generate_excel_report(self, data: List[dict], filename: str) -> FileResponse:
        df = pd.DataFrame(data)
        excel_file = BytesIO()
        
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Sales Report')
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Sales Report']
            for idx, col in enumerate(df.columns):
                max_length = max(
                    df[col].astype(str).apply(len).max(),
                    len(str(col))
                )
                worksheet.column_dimensions[chr(65 + idx)].width = max_length + 2
        
        excel_file.seek(0)
        
        return FileResponse(
            excel_file,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    