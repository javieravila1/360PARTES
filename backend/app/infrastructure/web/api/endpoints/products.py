from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id, get_current_user
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.brand import Brand
from app.infrastructure.database.models.category import Category
from app.infrastructure.database.models.business_user import BusinessUser
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.inventory import ProductBatch
from app.application.dtos.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_in: ProductCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = product_in.model_dump(exclude={"extra_business_ids"})
    db_product = Product(**data, business_id=business_id)
    db.add(db_product)
    
    # Create initial batch
    initial_batch = ProductBatch(
        business_id=business_id,
        product=db_product,
        current_stock=data.get("current_stock", 0),
        cost_price=data.get("cost_price", 0),
        selling_price=data.get("selling_price", 0)
    )
    db.add(initial_batch)

    # Copiar el producto a otros negocios del usuario
    extra_ids = {b for b in product_in.extra_business_ids if b != business_id}
    if extra_ids:
        stmt = select(BusinessUser.business_id).where(
            BusinessUser.user_id == current_user.id,
            BusinessUser.business_id.in_(extra_ids)
        )
        allowed = set((await db.execute(stmt)).scalars().all())
        if allowed != extra_ids:
            raise HTTPException(status_code=403, detail="No tienes acceso a uno de los negocios seleccionados")

        src_brand = await db.get(Brand, data["brand_id"]) if data.get("brand_id") else None
        src_category = await db.get(Category, data["category_id"]) if data.get("category_id") else None

        for target_id in extra_ids:
            copy_data = dict(data)
            copy_data["brand_id"] = None
            copy_data["category_id"] = None
            if src_brand:
                res = await db.execute(select(Brand).where(Brand.business_id == target_id, Brand.name == src_brand.name))
                brand = res.scalars().first()
                if not brand:
                    brand = Brand(business_id=target_id, name=src_brand.name, description=src_brand.description, logo=src_brand.logo)
                    db.add(brand)
                    await db.flush()
                copy_data["brand_id"] = brand.id
            if src_category:
                res = await db.execute(select(Category).where(Category.business_id == target_id, Category.name == src_category.name))
                category = res.scalars().first()
                if not category:
                    category = Category(business_id=target_id, name=src_category.name, description=src_category.description)
                    db.add(category)
                    await db.flush()
                copy_data["category_id"] = category.id
            new_prod = Product(**copy_data, business_id=target_id)
            db.add(new_prod)
            db.add(ProductBatch(
                business_id=target_id,
                product=new_prod,
                current_stock=copy_data.get("current_stock", 0),
                cost_price=copy_data.get("cost_price", 0),
                selling_price=copy_data.get("selling_price", 0)
            ))

    await db.commit()
    
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == db_product.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/", response_model=List[ProductResponse])
async def read_products(
    business_id: uuid.UUID = Depends(get_current_business_id),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.business_id == business_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductResponse)
async def read_product(
    product_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == product_id, Product.business_id == business_id)
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
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    await db.commit()
    
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    return result.scalar_one()

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
from typing import Optional

class StockIncrement(BaseModel):
    quantity: float
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None

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
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    previous_stock = product.current_stock
    
    # Cast to float or Decimal if necessary, assuming it behaves correctly
    product.current_stock = float(previous_stock) + data.quantity
    
    # Handle batches
    cost = data.cost_price if data.cost_price is not None else product.cost_price
    price = data.selling_price if data.selling_price is not None else product.selling_price
    
    # Check if a batch with same cost and price exists
    existing_batch = next((b for b in product.batches if float(b.cost_price) == cost and float(b.selling_price) == price), None)
    if existing_batch:
        existing_batch.current_stock = float(existing_batch.current_stock) + data.quantity
    else:
        new_batch = ProductBatch(
            business_id=business_id,
            product_id=product.id,
            current_stock=data.quantity,
            cost_price=cost,
            selling_price=price
        )
        db.add(new_batch)
    
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
    
    stmt = select(Product).options(selectinload(Product.batches)).where(Product.id == product_id, Product.business_id == business_id)
    result = await db.execute(stmt)
    return result.scalar_one()

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


