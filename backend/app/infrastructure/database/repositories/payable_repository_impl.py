import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.repositories.payable_repository import AccountPayableRepository
from app.domain.entities.payable_entity import AccountPayableEntity, PaymentEntity
from app.infrastructure.database.models.payable import AccountPayable, Payment

class AccountPayableRepositoryImpl(AccountPayableRepository):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, payable_id: uuid.UUID, business_id: uuid.UUID) -> Optional[AccountPayableEntity]:
        stmt = select(AccountPayable).where(
            AccountPayable.id == payable_id, 
            AccountPayable.business_id == business_id
        )
        result = await self.db.execute(stmt)
        db_model = result.scalar_one_or_none()
        
        if not db_model:
            return None
            
        return AccountPayableEntity(
            id=db_model.id,
            business_id=db_model.business_id,
            supplier_id=db_model.supplier_id,
            total_amount=float(db_model.total_amount),
            paid_amount=float(db_model.paid_amount),
            balance=float(db_model.balance),
            due_date=db_model.due_date,
            status=db_model.status
        )

    async def get_all_by_business(self, business_id: uuid.UUID) -> List[AccountPayableEntity]:
        stmt = select(AccountPayable).where(AccountPayable.business_id == business_id)
        result = await self.db.execute(stmt)
        models = result.scalars().all()
        
        return [
            AccountPayableEntity(
                id=m.id,
                business_id=m.business_id,
                supplier_id=m.supplier_id,
                total_amount=float(m.total_amount),
                paid_amount=float(m.paid_amount),
                balance=float(m.balance),
                due_date=m.due_date,
                status=m.status
            ) for m in models
        ]

    async def save(self, entity: AccountPayableEntity) -> AccountPayableEntity:
        stmt = select(AccountPayable).where(AccountPayable.id == entity.id)
        result = await self.db.execute(stmt)
        db_model = result.scalar_one_or_none()
        
        if db_model:
            # Update
            db_model.paid_amount = entity.paid_amount
            db_model.balance = entity.balance
            db_model.status = entity.status
            db_model.due_date = entity.due_date
        else:
            # Create (Omitido para brevedad en este ejemplo, se crearía a través de Purchase)
            pass
            
        await self.db.commit()
        return entity

    async def save_payment(self, payment: PaymentEntity) -> PaymentEntity:
        # Aquí payment.account_payable_id ya está referenciando correctamente
        # Necesitamos obtener el business_id a través de la cuenta
        stmt = select(AccountPayable).where(AccountPayable.id == payment.account_payable_id)
        res = await self.db.execute(stmt)
        acc = res.scalar_one()

        db_payment = Payment(
            id=payment.id,
            business_id=acc.business_id,
            account_payable_id=payment.account_payable_id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference
        )
        self.db.add(db_payment)
        await self.db.commit()
        return payment
