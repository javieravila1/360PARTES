from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.business import Business
from app.infrastructure.database.models.business_user import BusinessUser, BusinessRole
from app.application.dtos.auth import TokenPayload
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login", auto_error=False)

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    actual_token = request.cookies.get("access_token") or token
    if not actual_token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(actual_token, settings.JWT_SECRET, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    stmt = select(User).where(User.id == uuid.UUID(token_data.sub))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_business_id(
    x_business_id: str = Header(..., alias="X-Business-ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> uuid.UUID:
    try:
        business_uuid = uuid.UUID(x_business_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Business ID format")
        
    stmt = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_uuid
    )
    result = await db.execute(stmt)
    bu = result.scalar_one_or_none()
    
    if not bu:
        raise HTTPException(status_code=403, detail="Not enough permissions for this business")
        
    return business_uuid


