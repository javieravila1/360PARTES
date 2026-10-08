import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.infrastructure.database.models.contacts import Customer, Supplier
from app.application.dtos.contact_dto import CustomerCreate, CustomerUpdate, SupplierCreate, SupplierUpdate
from fastapi import HTTPException

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

    async def update_customer(self, business_id: uuid.UUID, customer_id: uuid.UUID, dto: CustomerUpdate) -> Customer:
        stmt = select(Customer).where(Customer.id == customer_id, Customer.business_id == business_id)
        result = await self.db.execute(stmt)
        customer = result.scalar_one_or_none()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        update_data = dto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(customer, key, value)
            
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def delete_customer(self, business_id: uuid.UUID, customer_id: uuid.UUID) -> None:
        stmt = select(Customer).where(Customer.id == customer_id, Customer.business_id == business_id)
        result = await self.db.execute(stmt)
        customer = result.scalar_one_or_none()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        await self.db.delete(customer)
        await self.db.commit()

    async def get_suppliers(self, business_id: uuid.UUID) -> List[Supplier]:
        stmt = select(Supplier).where(Supplier.business_id == business_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_supplier(self, business_id: uuid.UUID, dto: SupplierCreate) -> Supplier:
        data = dto.model_dump(exclude={"additional_business_ids"})
        
        db_supplier = Supplier(**data, business_id=business_id)
        self.db.add(db_supplier)
        
        if dto.additional_business_ids:
            for extra_id in dto.additional_business_ids:
                if extra_id != business_id:
                    extra_supplier = Supplier(**data, business_id=extra_id)
                    self.db.add(extra_supplier)
                    
        await self.db.commit()
        await self.db.refresh(db_supplier)
        return db_supplier

    async def update_supplier(self, business_id: uuid.UUID, supplier_id: uuid.UUID, dto: SupplierUpdate) -> Supplier:
        stmt = select(Supplier).where(Supplier.id == supplier_id, Supplier.business_id == business_id)
        result = await self.db.execute(stmt)
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
            
        update_data = dto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(supplier, key, value)
            
        await self.db.commit()
        await self.db.refresh(supplier)
        return supplier

    async def delete_supplier(self, business_id: uuid.UUID, supplier_id: uuid.UUID) -> None:
        stmt = select(Supplier).where(Supplier.id == supplier_id, Supplier.business_id == business_id)
        result = await self.db.execute(stmt)
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
            
        await self.db.delete(supplier)
        await self.db.commit()
