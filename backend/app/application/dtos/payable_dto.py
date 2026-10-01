from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid

class AccountPayableResponseDTO(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    total_amount: float
    paid_amount: float
    balance: float
    due_date: date
    status: str

class MakePaymentDTO(BaseModel):
    amount: float
    payment_method: str = "CASH"
    reference: Optional[str] = None
