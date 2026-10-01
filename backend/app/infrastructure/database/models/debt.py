import uuid
from sqlalchemy import String, ForeignKey, Numeric, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import List, Optional
from app.infrastructure.database.models.base import BaseModel
from datetime import date


class Debt(BaseModel):
    """Modelo unificado para Deudas por Cobrar y por Pagar creadas manualmente."""
    __tablename__ = "debts"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)

    debt_type: Mapped[str] = mapped_column(String)  # RECEIVABLE (cobrar) | PAYABLE (pagar)
    concept: Mapped[str] = mapped_column(String)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Datos del contacto (libre, sin FK para mayor flexibilidad)
    contact_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    balance: Mapped[float] = mapped_column(Numeric(12, 2))

    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")  # PENDING, PARTIAL, PAID

    payments: Mapped[List["DebtPayment"]] = relationship(back_populates="debt", cascade="all, delete-orphan")


class DebtPayment(BaseModel):
    """Registro de abonos sobre una deuda."""
    __tablename__ = "debt_payments"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    debt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("debts.id", ondelete="CASCADE"), index=True)

    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    payment_date: Mapped[date] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    debt: Mapped["Debt"] = relationship(back_populates="payments")
