from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.database.models.category import Category
from app.application.dtos.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_in: CategoryCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    db_category = Category(**category_in.model_dump(), business_id=business_id)
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.business_id == business_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == category_id, Category.business_id == business_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
        
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == category_id, Category.business_id == business_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await db.delete(category)
    await db.commit()

