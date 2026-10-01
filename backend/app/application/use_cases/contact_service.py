import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.infrastructure.database.models.contacts import Customer, Supplier
from app.application.dtos.contact_dto import CustomerCreate, SupplierCreate

# Aquí combinaremos Repositorio y Caso de Uso en una clase de servicio 
# simplificada (patrón CQRS ligero) para evitar exceso de archivos en CRUDS básicos.
class ContactService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_customers(self, business_id: uuid.UUID) -> List[Customer]:
        stmt = select(Customer).where(Customer.business_id == business_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_customer(self, business_id: uuid.UUID, dto: CustomerCreate) -> Customer:
        db_customer = Customer(**dto.model_dump(), business_id=business_id)
        self.db.add(db_customer)
        await self.db.commit()
        await self.db.refresh(db_customer)
        return db_customer

    async def get_suppliers(self, business_id: uuid.UUID) -> List[Supplier]:
        stmt = select(Supplier).where(Supplier.business_id == business_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_supplier(self, business_id: uuid.UUID, dto: SupplierCreate) -> Supplier:
        db_supplier = Supplier(**dto.model_dump(), business_id=business_id)
        self.db.add(db_supplier)
        await self.db.commit()
        await self.db.refresh(db_supplier)
        return db_supplier
