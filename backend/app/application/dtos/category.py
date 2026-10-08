from typing import Optional
from pydantic import BaseModel, field_validator
import uuid
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

    @field_validator('name', 'description', mode='before')
    @classmethod
    def to_upper(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

