from pydantic import BaseModel, validator
from fastapi import Query
from typing import List, Optional
from datetime import datetime, timedelta


class DateRangeParams(BaseModel):
    start_date: datetime
    end_date: datetime

    @validator('end_date')
    def validate_date_range(cls, end_date, values):
        if 'start_date' in values and end_date < values['start_date']:
            raise ValueError("end_date must be after start_date")
        
        # Limit date range to 1 year
        if 'start_date' in values and end_date - values['start_date'] > timedelta(days=365):
            raise ValueError("Date range cannot exceed 1 year")
        return end_date

class PaginationParams(BaseModel):
    page: int = Query(1, ge=1)
    page_size: int = Query(50, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v

class FilterParams(BaseModel):
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    categories: Optional[List[str]] = None
    products: Optional[List[str]] = None
    group_by: Optional[List[str]] = None
    receipt_number: Optional[str] = None

    @validator('max_amount')
    def validate_amount_range(cls, max_amount, values):
        min_amount = values.get('min_amount')
        if min_amount is not None and max_amount is not None and max_amount < min_amount:
            raise ValueError("max_amount must be greater than min_amount")
        return max_amount