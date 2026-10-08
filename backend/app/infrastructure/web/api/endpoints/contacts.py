from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.application.dtos.contact_dto import CustomerCreate, CustomerResponse, CustomerUpdate, SupplierCreate, SupplierResponse, SupplierUpdate
from fastapi import status
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

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    customer_in: CustomerUpdate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.update_customer(business_id, customer_id, customer_in)

@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    await service.delete_customer(business_id, customer_id)

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

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: uuid.UUID,
    supplier_in: SupplierUpdate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    return await service.update_supplier(business_id, supplier_id, supplier_in)

@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: ContactService = Depends(get_contact_service)
):
    await service.delete_supplier(business_id, supplier_id)
