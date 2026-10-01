from dataclasses import dataclass
from datetime import date
from typing import Optional
import uuid

@dataclass
class PaymentEntity:
    id: uuid.UUID
    account_payable_id: uuid.UUID
    amount: float
    payment_date: date
    payment_method: str
    reference: Optional[str] = None

@dataclass
class AccountPayableEntity:
    id: uuid.UUID
    business_id: uuid.UUID
    supplier_id: uuid.UUID
    total_amount: float
    paid_amount: float
    balance: float
    due_date: date
    status: str

    def apply_payment(self, amount: float) -> PaymentEntity:
        if amount <= 0:
            raise ValueError("El pago debe ser mayor a 0")
        if amount > self.balance:
            raise ValueError(f"El abono ({amount}) excede el saldo restante ({self.balance})")
        
        self.paid_amount += amount
        self.balance -= amount
        
        if self.balance <= 0:
            self.status = "PAID"
            self.balance = 0.0
        else:
            self.status = "PARTIAL"

        return PaymentEntity(
            id=uuid.uuid4(),
            account_payable_id=self.id,
            amount=amount,
            payment_date=date.today(),
            payment_method="CASH", # Default, can be overridden
        )
