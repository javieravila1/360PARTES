import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.application.dtos.cash_dto import CashSessionOpenDTO, CashSessionCloseDTO, ExpenseCreateDTO
from app.infrastructure.database.models.cash import CashSession
from app.infrastructure.database.models.expense import Expense
from app.infrastructure.database.models.user import User

class CashService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ================== CAJA ==================
    async def get_current_session(self, business_id: uuid.UUID) -> Optional[CashSession]:
        stmt = select(CashSession).where(
            CashSession.business_id == business_id,
            CashSession.status == "OPEN"
        ).order_by(CashSession.opened_at.desc()).limit(1)
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_sessions(self, business_id: uuid.UUID) -> List[CashSession]:
        stmt = select(CashSession).where(CashSession.business_id == business_id).order_by(CashSession.opened_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def open_session(self, business_id: uuid.UUID, current_user: User, dto: CashSessionOpenDTO) -> CashSession:
        existing = await self.get_current_session(business_id)
        if existing:
            raise ValueError("Ya existe una caja abierta para este negocio. Ciérrela primero.")
            
        new_session = CashSession(
            business_id=business_id,
            user_id=current_user.id,
            expected_cash=dto.expected_cash,
            status="OPEN"
        )
        self.db.add(new_session)
        await self.db.commit()
        await self.db.refresh(new_session)
        return new_session

    async def close_session(self, session_id: uuid.UUID, business_id: uuid.UUID, dto: CashSessionCloseDTO) -> CashSession:
        stmt = select(CashSession).where(CashSession.id == session_id, CashSession.business_id == business_id)
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()
        
        if not session:
            raise ValueError("Sesión de caja no encontrada")
        if session.status == "CLOSED":
            raise ValueError("Esta sesión de caja ya está cerrada")

        session.closed_at = datetime.now(timezone.utc)
        session.actual_cash = dto.actual_cash
        session.difference = dto.actual_cash - float(session.expected_cash)
        session.status = "CLOSED"
        
        await self.db.commit()
        await self.db.refresh(session)
        return session

    # ================== GASTOS ==================
    async def create_expense(self, business_id: uuid.UUID, current_user: User, dto: ExpenseCreateDTO) -> Expense:
        db_expense = Expense(
            business_id=business_id,
            user_id=current_user.id,
            category=dto.category,
            description=dto.description,
            amount=dto.amount,
            expense_date=dto.expense_date,
            payment_method=dto.payment_method,
            notes=dto.notes
        )
        self.db.add(db_expense)
        await self.db.commit()
        await self.db.refresh(db_expense)
        return db_expense

    async def get_expenses(self, business_id: uuid.UUID) -> List[Expense]:
        stmt = select(Expense).where(Expense.business_id == business_id).order_by(Expense.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()
