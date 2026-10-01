from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.application.dtos.contact_dto import CustomerCreate, CustomerResponse, SupplierCreate, SupplierResponse
from app.application.use_cases.contact_service import ContactService

router = APIRouter()

def get_contact_service(db: AsyncSession = Depends(get_db)) -> ContactService:
    return ContactService(db)

@router.get("/customers", response_model=List[CustomerResponse])
async def read_customers(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.get_customers(business_id)

@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer_in: CustomerCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.create_customer(business_id, customer_in)

@router.get("/suppliers", response_model=List[SupplierResponse])
async def read_suppliers(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.get_suppliers(business_id)

@router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(
    supplier_in: SupplierCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.create_supplier(business_id, supplier_in)
