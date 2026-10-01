from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.database.models.product import Product
from app.application.dtos.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_in: ProductCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    db_product = Product(**product_in.model_dump(), business_id=business_id)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductResponse])
async def read_products(
    business_id: uuid.UUID = Depends(get_current_business_id),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.business_id == business_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductResponse)
async def read_product(
    product_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    await db.delete(product)
    await db.commit()

from pydantic import BaseModel
class StockIncrement(BaseModel):
    quantity: float

from app.infrastructure.database.models.inventory import InventoryMovement
from app.infrastructure.web.api.deps import get_current_user
from app.infrastructure.database.models.user import User

@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def increment_stock(
    product_id: uuid.UUID,
    data: StockIncrement,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    previous_stock = product.current_stock
    
    # Cast to float or Decimal if necessary, assuming it behaves correctly
    product.current_stock = float(previous_stock) + data.quantity
    
    if product.track_inventory:
        movement = InventoryMovement(
            business_id=business_id,
            product_id=product.id,
            user_id=current_user.id,
            movement_type="ENTRADA_COMPRA",
            quantity=data.quantity,
            previous_stock=previous_stock,
            new_stock=product.current_stock,
            reference_id="AGREGADO_DIRECTO"
        )
        db.add(movement)

    await db.commit()
    await db.refresh(product)
    return product

@router.get("/{product_id}/history", response_model=List[dict])
async def get_product_history(
    product_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InventoryMovement).where(
        InventoryMovement.product_id == product_id,
        InventoryMovement.business_id == business_id
    ).order_by(InventoryMovement.created_at.desc())
    
    result = await db.execute(stmt)
    movements = result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "movement_type": m.movement_type,
            "quantity": float(m.quantity),
            "previous_stock": float(m.previous_stock),
            "new_stock": float(m.new_stock),
            "reason": m.reason,
            "reference_id": m.reference_id,
            "created_at": m.created_at
        } for m in movements
    ]


