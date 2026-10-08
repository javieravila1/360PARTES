from typing import Optional
from pydantic import BaseModel, field_validator
import uuid
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    document_type: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

    @field_validator('name', 'notes', 'city', 'address', 'document_id', mode='before')
    @classmethod
    def to_upper(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    company_name: str
    document_id: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

    @field_validator('company_name', 'contact_person', 'notes', 'city', 'address', 'document_id', mode='before')
    @classmethod
    def to_upper(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    company_name: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

