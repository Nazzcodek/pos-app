#!/usr/bin/python3

from fastapi import APIRouter
from . import users, categories, products, sales, sessions, settings, inventories, suppliers, invoices
#, , inventory, sales, suppliers, invoices

api_router = APIRouter()

# router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/api/v1/user")
api_router.include_router(categories.router, prefix="/api/v1/category")
api_router.include_router(products.router, prefix="/api/v1/product")
api_router.include_router(sales.router, prefix="/api/v1/sales")
api_router.include_router(sessions.router, prefix="/api/v1/session")
api_router.include_router(settings.router, prefix="/api/v1/settings")
api_router.include_router(inventories.router, prefix="/api/v1/inventory")
api_router.include_router(suppliers.router, prefix="/api/v1/supplier")
api_router.include_router(invoices.router, prefix="/api/v1/invoice")