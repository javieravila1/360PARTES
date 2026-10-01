from fastapi import APIRouter
from app.infrastructure.web.api.endpoints import auth, businesses, brands, categories, products, sales, dashboard, payables, contacts, purchases, cash, files, debts

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["businesses"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(payables.router, prefix="/payables", tags=["payables"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(cash.router, prefix="/cash", tags=["cash"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(debts.router, prefix="/debts", tags=["debts"])








