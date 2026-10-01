from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

class BrandBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    is_active: bool = True

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BrandBase):
    name: Optional[str] = None

class BrandResponse(BrandBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

