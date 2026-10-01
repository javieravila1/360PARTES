import uuid
from sqlalchemy import String, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import List
from app.infrastructure.database.models.base import BaseModel
from datetime import date

class AccountPayable(BaseModel):
    __tablename__ = "accounts_payable"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), index=True)
    purchase_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id", ondelete="SET NULL"), nullable=True)
    
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    balance: Mapped[float] = mapped_column(Numeric(12, 2))
    
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String) # PENDING, PARTIAL, PAID, OVERDUE

    business: Mapped["Business"] = relationship()
    supplier: Mapped["Supplier"] = relationship()
    purchase: Mapped["Purchase"] = relationship()
    payments: Mapped[List["Payment"]] = relationship(back_populates="account_payable", cascade="all, delete-orphan")

class Payment(BaseModel):
    __tablename__ = "payments"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    account_payable_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts_payable.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    payment_date: Mapped[date] = mapped_column(Date)
    payment_method: Mapped[str] = mapped_column(String)
    reference: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    business: Mapped["Business"] = relationship()
    account_payable: Mapped["AccountPayable"] = relationship(back_populates="payments")
    user: Mapped["User"] = relationship()

