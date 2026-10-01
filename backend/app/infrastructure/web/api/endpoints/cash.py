from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id, get_current_user
from app.infrastructure.database.models.user import User
from app.application.dtos.cash_dto import CashSessionOpenDTO, CashSessionCloseDTO, CashSessionResponseDTO, ExpenseCreateDTO, ExpenseResponseDTO
from app.application.use_cases.cash_service import CashService

router = APIRouter()

def get_cash_service(db: AsyncSession = Depends(get_db)) -> CashService:
    return CashService(db)

# ================= CAJA =================
@router.get("/sessions/current", response_model=Optional[CashSessionResponseDTO])
async def get_current_session(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: CashService = Depends(get_cash_service)
):
    return await service.get_current_session(business_id)

@router.get("/sessions", response_model=List[CashSessionResponseDTO])
async def get_all_sessions(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: CashService = Depends(get_cash_service)
):
    return await service.get_all_sessions(business_id)

@router.post("/sessions/open", response_model=CashSessionResponseDTO)
async def open_session(
    dto: CashSessionOpenDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    service: CashService = Depends(get_cash_service)
):
    try:
        return await service.open_session(business_id, current_user, dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sessions/{session_id}/close", response_model=CashSessionResponseDTO)
async def close_session(
    session_id: uuid.UUID,
    dto: CashSessionCloseDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: CashService = Depends(get_cash_service)
):
    try:
        return await service.close_session(session_id, business_id, dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ================= GASTOS =================
@router.get("/expenses", response_model=List[ExpenseResponseDTO])
async def read_expenses(
    business_id: uuid.UUID = Depends(get_current_business_id),
    service: CashService = Depends(get_cash_service)
):
    return await service.get_expenses(business_id)

@router.post("/expenses", response_model=ExpenseResponseDTO)
async def create_expense(
    dto: ExpenseCreateDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    service: CashService = Depends(get_cash_service)
):
    return await service.create_expense(business_id, current_user, dto)
