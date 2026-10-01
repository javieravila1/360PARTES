from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import datetime

class SaleDetailBase(BaseModel):
    product_id: uuid.UUID
    quantity: float
    unit_price: float
    discount: float = 0.0

class SaleDetailCreate(SaleDetailBase):
    pass

class SaleBase(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    payment_method: str
    payment_status: str
    notes: Optional[str] = None
    sale_date: Optional[str] = None

class SaleCreate(SaleBase):
    details: List[SaleDetailCreate]

class SaleResponse(SaleBase):
    id: uuid.UUID
    business_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

