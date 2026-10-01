from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.application.dtos.payable_dto import MakePaymentDTO, AccountPayableResponseDTO
from app.application.use_cases.payable_usecase import PayableUseCase
from app.infrastructure.database.repositories.payable_repository_impl import AccountPayableRepositoryImpl

router = APIRouter()

# Dependency Injection Builder
def get_payable_use_case(db: AsyncSession = Depends(get_db)) -> PayableUseCase:
    repo = AccountPayableRepositoryImpl(db)
    return PayableUseCase(repo)

@router.get("/", response_model=List[AccountPayableResponseDTO])
async def read_payables(
    business_id: uuid.UUID = Depends(get_current_business_id),
    use_case: PayableUseCase = Depends(get_payable_use_case)
):
    """
    Endpoint Hexagonal: El enrutador no sabe de bases de datos. 
    Solo inyecta dependencias e invoca al orquestador (Caso de Uso).
    """
    return await use_case.get_payables_by_business(business_id)

@router.post("/{payable_id}/payments", response_model=AccountPayableResponseDTO)
async def register_payment(
    payable_id: uuid.UUID,
    payment_in: MakePaymentDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    use_case: PayableUseCase = Depends(get_payable_use_case)
):
    try:
        result = await use_case.register_payment(payable_id, business_id, payment_in)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
