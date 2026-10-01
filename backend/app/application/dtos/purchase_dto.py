from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import uuid

class PurchaseDetailDTO(BaseModel):
    product_id: uuid.UUID
    quantity: float
    unit_cost: float
    discount: float = 0.0

class PurchaseCreateDTO(BaseModel):
    supplier_id: Optional[uuid.UUID] = None
    invoice_number: Optional[str] = None
    purchase_date: date
    due_date: Optional[date] = None
    
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    
    payment_method: str
    payment_status: str # PAID, PENDING, PARTIAL
    amount_paid: float = 0.0 # Cuánto se pagó de contado si fue parcial
    notes: Optional[str] = None
    
    details: List[PurchaseDetailDTO]

class PurchaseResponseDTO(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    supplier_id: Optional[uuid.UUID] = None
    total: float
    payment_status: str
    purchase_date: date

    class Config:
        from_attributes = True
