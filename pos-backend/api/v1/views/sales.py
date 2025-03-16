from fastapi import APIRouter, Depends, HTTPException, Query
from models.schemas.sale import SaleCreate, SaleSummary, SaleItemsSummary, SaleResponse
from models.validation import PaginationParams, FilterParams, DateRangeParams
from services.sales import Sales, SalesExport
from services.auth import get_current_user
from services.permission import role_required
from models.user import User
from typing import Dict, List, Any, Union
from uuid import UUID
from datetime import date
from services.sessionManager import SessionManager

router = APIRouter(tags=["Sales"])

@router.post("/create", response_model=Dict[str, Any])
@role_required(["cashier"], 'sales', 'create')
async def create_sale(
    sale_data: SaleCreate,
    current_user: User = Depends(get_current_user),
    sales_service: Sales = Depends()
):
    """Create a new sale"""
    return sales_service.create_sale(
        current_user.id, 
        UUID(current_user.current_session_id), 
        sale_data
    )

@router.get("/{sale_id}", response_model=SaleResponse)
@role_required(["supervisor"], 'sales', 'read')
async def get_sale(
    sale_id: UUID,
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sale"""
    sale = sales_service.get_sale(sale_id)
    return SaleResponse.from_orm(sale)

@router.put("/update/{sale_id}", response_model=SaleResponse)
@role_required(["admin"], 'sales', 'update')
async def update_sale(
    sale_id: UUID,
    sale_data: SaleCreate,
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Update a sale"""
    return sales_service.update_sale(sale_id, sale_data)

@router.delete("/delete/{sale_id}")
@role_required(["admin"], 'sales', 'delete')
async def delete_sale(
    sale_id: UUID,
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Delete a sale"""
    sales_service.delete_sale(sale_id)
    return {"message": "Sale deleted"}

@router.get("/report/date-range", response_model=SaleSummary)
@role_required(["supervisor"], 'sales', 'read')
async def get_sales_report(
    date_range: DateRangeParams = Depends(),
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for a date range with pagination and filters"""
    return sales_service.get_sales_report(
        date_range.start_date,
        date_range.end_date,
        pagination,
        filters
    )

@router.get("/report/items", response_model=SaleItemsSummary)
@role_required(["supervisor"], 'sales', 'read')
async def get_sales_items_report(
    date_range: DateRangeParams = Depends(),
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get item-level sales report for a date range"""
    return sales_service.get_sales_items_report(
        date_range.start_date,
        date_range.end_date,
        pagination,
        filters
    )

@router.get("/report/daily/{date}", response_model=Dict[str, Union[date, float]])
@role_required(["supervisor"], 'sales', 'read')
async def get_daily_sales(
    date: date,
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for a specific day"""
    return sales_service.get_daily_sales_report(date, report_type)

@router.get("/report/weekly", response_model=Dict[str, Union[float, list]])
@role_required(["supervisor"], 'sales', 'read')
async def get_weekly_sales(
    start_date: date,
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for a week"""
    return sales_service.get_weekly_sales_report(start_date, report_type)

@router.get("/report/monthly/{year}/{month}", response_model=Dict[str, Union[float, list]])
@role_required(["supervisor"], 'sales', 'read')
async def get_monthly_sales(
    year: int,
    month: int,
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for a month"""
    return sales_service.get_monthly_sales_report(year, month, report_type)

@router.get("/report/hourly/{date}/{hour}", response_model=Dict[str, Union[date, int, float]])
@role_required(["supervisor"], 'sales', 'read')
async def get_hourly_sales(
    date: date,
    hour: int,
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for an hour"""
    if hour < 0 or hour > 23:
        raise HTTPException(status_code=400, detail="Hour must be between 0 and 23")
    return sales_service.get_hourly_sales_report(date, hour, report_type)

@router.get("/receipt/{sale_id}")
@role_required(["cashier"], 'sales', 'read')
async def get_receipt(
    sale_id: UUID,
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Generate receipt for a sale"""
    return sales_service.generate_receipt(sale_id)

@router.get('/report/current-session', response_model=Union[SaleSummary, SaleItemsSummary])
@role_required(["cashier"], 'sales', 'read')
async def get_current_session_report(
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for the current session"""
    if report_type in ['sales', 'items']:
        return sales_service.get_current_session_report(
            current_user.id,
            report_type
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type. Must be 'sales' or 'items'"
        )

@router.get('/report/user-session/', response_model=Union[SaleSummary, SaleItemsSummary])
@role_required(["cashier"], 'sales', 'read')
async def get_user_session_report(
    report_type: str = Query('sales', description="Report type: 'sales' or 'items'"),
    sales_service: Sales = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get sales report for the current session"""
    if report_type in ['sales', 'items']:
        return sales_service.get_user_session_report(
            current_user.id,
            report_type
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type. Must be 'sales' or 'items'"
        )

@router.get("/export/{format}")
@role_required(["supervisor"], 'exports', 'create')
async def export_sales(
    format: str,
    current_user: User = Depends(get_current_user),
    date_range: DateRangeParams = Depends(),
    filters: FilterParams = Depends(),
    pagination: PaginationParams = Depends(),
    sales_service: Sales = Depends(),
    export_service: SalesExport = Depends(),
    columns: List[str] = Query(default=None)
):
    try:
        data = sales_service.get_sales_items_report(
            date_range.start_date,
            date_range.end_date,
            pagination,
            filters
        )
        
        if not data:
            raise HTTPException(
                status_code=404,
                detail="No data available for export"
            )

        # Convert Pydantic model to dict if needed
        data_dict = data.dict() if hasattr(data, 'dict') else data
        
        # Now pass the dict to export_data
        return await export_service.export_data(
            format,
            data_dict,
            date_range.start_date,
            date_range.end_date,
            visible_columns=columns
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )
    