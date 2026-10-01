from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

# Cash Session DTOs
class CashSessionOpenDTO(BaseModel):
    expected_cash: float = 0.0

class CashSessionCloseDTO(BaseModel):
    actual_cash: float

class CashSessionResponseDTO(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    opened_at: datetime
    closed_at: Optional[datetime]
    expected_cash: float
    actual_cash: Optional[float]
    difference: Optional[float]
    status: str
    
    class Config:
        from_attributes = True

# Expense DTOs
class ExpenseCreateDTO(BaseModel):
    category: str
    description: str
    amount: float
    expense_date: date
    payment_method: str
    notes: Optional[str] = None

class ExpenseResponseDTO(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    category: str
    description: str
    amount: float
    expense_date: date
    payment_method: str
    
    class Config:
        from_attributes = True
