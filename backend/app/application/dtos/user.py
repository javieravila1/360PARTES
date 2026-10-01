from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
from app.infrastructure.database.models.user import UserRoleGlobal

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    global_role: UserRoleGlobal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

