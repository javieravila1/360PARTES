from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
import uuid
from decimal import Decimal

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id, get_current_user
from app.infrastructure.database.models.debt import Debt, DebtPayment

router = APIRouter()

# --- DTOs ---
class CreateDebtDTO(BaseModel):
    debt_type: str          # RECEIVABLE | PAYABLE
    concept: str
    contact_name: Optional[str] = None
    total_amount: float
    due_date: Optional[date] = None
    credit_date: Optional[date] = None
    notes: Optional[str] = None

class CreateDebtPaymentDTO(BaseModel):
    amount: float
    payment_date: date
    notes: Optional[str] = None

class DebtPaymentOut(BaseModel):
    id: uuid.UUID
    amount: float
    payment_date: date
    notes: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class DebtOut(BaseModel):
    id: uuid.UUID
    debt_type: str
    concept: str
    contact_name: Optional[str]
    total_amount: float
    paid_amount: float
    balance: float
    due_date: Optional[date]
    status: str
    notes: Optional[str]
    created_at: str
    payments: List[DebtPaymentOut] = []

    class Config:
        from_attributes = True


# --- Helpers ---
def to_float(val) -> float:
    if val is None:
        return 0.0
    return float(val)

def serialize_debt(d: Debt) -> dict:
    payments = []
    for p in (d.payments or []):
        payments.append({
            "id": str(p.id),
            "amount": to_float(p.amount),
            "payment_date": str(p.payment_date),
            "notes": p.notes,
            "created_at": str(p.created_at),
        })
    return {
        "id": str(d.id),
        "debt_type": d.debt_type,
        "concept": d.concept,
        "contact_name": d.contact_name,
        "total_amount": to_float(d.total_amount),
        "paid_amount": to_float(d.paid_amount),
        "balance": to_float(d.balance),
        "due_date": str(d.due_date) if d.due_date else None,
        "status": d.status,
        "notes": d.notes,
        "created_at": str(d.created_at),
        "payments": payments,
    }


# --- Endpoints ---

@router.get("/")
async def list_debts(
    debt_type: Optional[str] = None,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    conditions = [Debt.business_id == business_id]
    if debt_type:
        conditions.append(Debt.debt_type == debt_type)
    
    result = await db.execute(
        select(Debt)
        .where(and_(*conditions))
        .options(selectinload(Debt.payments))
        .order_by(Debt.created_at.desc())
    )
    debts = result.scalars().all()
    return [serialize_debt(d) for d in debts]


@router.post("/")
async def create_debt(
    data: CreateDebtDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    total = Decimal(str(data.total_amount))
    debt = Debt(
        business_id=business_id,
        debt_type=data.debt_type,
        concept=data.concept,
        contact_name=data.contact_name,
        total_amount=total,
        paid_amount=Decimal("0"),
        balance=total,
        due_date=data.due_date,
        notes=data.notes,
        status="PENDING",
    )
    if data.credit_date:
        from datetime import datetime
        debt.created_at = datetime.combine(data.credit_date, datetime.min.time())
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    # Cargar payments
    result = await db.execute(
        select(Debt).where(Debt.id == debt.id).options(selectinload(Debt.payments))
    )
    debt = result.scalar_one()
    return serialize_debt(debt)


@router.post("/{debt_id}/payments")
async def add_payment(
    debt_id: uuid.UUID,
    data: CreateDebtPaymentDTO,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Debt).where(and_(Debt.id == debt_id, Debt.business_id == business_id))
        .options(selectinload(Debt.payments))
    )
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")

    amount = Decimal(str(data.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="El monto del abono debe ser mayor a 0")
    if amount > debt.balance:
        raise HTTPException(status_code=400, detail=f"El abono (${amount}) supera el saldo pendiente (${debt.balance})")

    payment = DebtPayment(
        business_id=business_id,
        debt_id=debt.id,
        amount=amount,
        payment_date=data.payment_date,
        notes=data.notes,
    )
    db.add(payment)

    debt.paid_amount = Decimal(str(debt.paid_amount)) + amount
    debt.balance = Decimal(str(debt.total_amount)) - debt.paid_amount
    if debt.balance <= 0:
        debt.status = "PAID"
        debt.balance = Decimal("0")
    else:
        debt.status = "PARTIAL"

    await db.commit()
    await db.refresh(debt)
    result = await db.execute(
        select(Debt).where(Debt.id == debt.id).options(selectinload(Debt.payments))
    )
    debt = result.scalar_one()
    return serialize_debt(debt)


@router.delete("/{debt_id}", status_code=204)
async def delete_debt(
    debt_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Debt).where(and_(Debt.id == debt_id, Debt.business_id == business_id))
    )
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    await db.delete(debt)
    await db.commit()
