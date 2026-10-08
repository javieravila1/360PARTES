from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_user
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.business import Business
from app.infrastructure.database.models.business_user import BusinessUser, BusinessRole
from app.application.dtos.business import BusinessCreate, BusinessResponse, BusinessWithRoleResponse, BusinessUpdate
from fastapi import status

router = APIRouter()

@router.post("/", response_model=BusinessResponse)
async def create_business(
    business_in: BusinessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Crear el negocio
    db_business = Business(**business_in.model_dump())
    db.add(db_business)
    await db.flush()  # Para obtener el ID generado sin commitear aÃºn

    # 2. Asociar el usuario actual como OWNER del negocio
    business_user = BusinessUser(
        user_id=current_user.id,
        business_id=db_business.id,
        role=BusinessRole.OWNER
    )
    db.add(business_user)
    
    await db.commit()
    await db.refresh(db_business)
    return db_business

@router.get("/", response_model=List[BusinessWithRoleResponse])
async def read_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Obtener los negocios donde el usuario tiene algÃºn rol
    stmt = (
        select(BusinessUser)
        .where(BusinessUser.user_id == current_user.id)
        .options(selectinload(BusinessUser.business))
    )
    result = await db.execute(stmt)
    business_users = result.scalars().all()
    
    response = []
    for bu in business_users:
        if bu.business.is_active:
            response.append({
                "business": bu.business,
                "role": bu.role
            })
    return response

@router.get("/{business_id}", response_model=BusinessResponse)
async def read_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validar que el usuario pertenece a este negocio
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found")
        
    return business

@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: uuid.UUID,
    business_in: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id,
        BusinessUser.role == BusinessRole.OWNER
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only owners can update business")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found")
        
    update_data = business_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)
        
    await db.commit()
    await db.refresh(business)
    return business

@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id,
        BusinessUser.role == BusinessRole.OWNER
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only owners can delete business")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    business.is_active = False # Soft delete
    await db.commit()
