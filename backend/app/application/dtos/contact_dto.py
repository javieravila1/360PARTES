from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

# Base models for reuse
class CustomerBase(BaseModel):
    name: str
    document_type: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    company_name: str
    document_id: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
