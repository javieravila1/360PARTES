from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.infrastructure.database.models.user import User
from app.application.dtos.user import UserCreate, UserResponse
from app.application.dtos.auth import Token, PasswordChange
from app.infrastructure.web.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    stmt = select(User).where(User.email == form_data.username.strip())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_EXPIRE)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.JWT_ACCESS_EXPIRE * 60,
        expires=settings.JWT_ACCESS_EXPIRE * 60,
        samesite="lax",
        secure=False, # should be True in production with HTTPS
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        samesite="lax",
        secure=False
    )
    return {"message": "Logged out successfully"}

@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        profile_picture=user_in.profile_picture,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@router.put("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Contraseña actual incorrecta"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.add(current_user)
    await db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

