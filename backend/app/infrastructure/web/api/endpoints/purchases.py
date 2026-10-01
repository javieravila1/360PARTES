from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id, get_current_user
from app.infrastructure.database.models.user import User
from app.application.dtos.purchase_dto import PurchaseCreateDTO, PurchaseResponseDTO
from app.application.use_cases.purchase_service import PurchaseService

router = APIRouter()

def get_purchase_service(db: AsyncSession = Depends(get_db)) -> PurchaseService:
    return PurchaseService(db)

@router.post("/", response_model=PurchaseResponseDTO)
async def create_purchase(
    purchase_in: PurchaseCreateDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    service: PurchaseService = Depends(get_purchase_service)
):
    try:
        return await service.create_purchase(business_id, current_user, purchase_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PurchaseResponseDTO])
async def read_purchases(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: PurchaseService = Depends(get_purchase_service)
):
    return await service.get_purchases(business_id)
