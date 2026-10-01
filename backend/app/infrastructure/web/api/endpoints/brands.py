from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.database.models.brand import Brand
from app.application.dtos.brand import BrandCreate, BrandResponse, BrandUpdate

router = APIRouter()

@router.post("/", response_model=BrandResponse)
async def create_brand(
    brand_in: BrandCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    db_brand = Brand(**brand_in.model_dump(), business_id=business_id)
    db.add(db_brand)
    await db.commit()
    await db.refresh(db_brand)
    return db_brand

@router.get("/", response_model=List[BrandResponse])
async def read_brands(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Brand).where(Brand.business_id == business_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: uuid.UUID,
    brand_in: BrandUpdate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Brand).where(Brand.id == brand_id, Brand.business_id == business_id)
    result = await db.execute(stmt)
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    update_data = brand_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(brand, key, value)
        
    await db.commit()
    await db.refresh(brand)
    return brand

@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Brand).where(Brand.id == brand_id, Brand.business_id == business_id)
    result = await db.execute(stmt)
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    await db.delete(brand)
    await db.commit()

