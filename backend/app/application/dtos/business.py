from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
from app.infrastructure.database.models.business_user import BusinessRole

class BusinessBase(BaseModel):
    name: str
    logo: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    currency: str = "COP"

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BusinessBase):
    name: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BusinessWithRoleResponse(BaseModel):
    business: BusinessResponse
    role: BusinessRole

    class Config:
        from_attributes = True

