import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import List
from app.infrastructure.database.models.base import BaseModel
from datetime import date

class Purchase(BaseModel):
    __tablename__ = "purchases"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number: Mapped[str | None] = mapped_column(String, nullable=True)
    purchase_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    payment_method: Mapped[str] = mapped_column(String) # CASH, TRANSFER, CREDIT
    payment_status: Mapped[str] = mapped_column(String) # PAID, PENDING, PARTIAL
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    business: Mapped["Business"] = relationship()
    supplier: Mapped["Supplier"] = relationship()
    user: Mapped["User"] = relationship()
    details: Mapped[List["PurchaseDetail"]] = relationship(back_populates="purchase", cascade="all, delete-orphan")

class PurchaseDetail(BaseModel):
    __tablename__ = "purchase_details"

    purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 2))
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2))
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2))

    purchase: Mapped["Purchase"] = relationship(back_populates="details")
    product: Mapped["Product"] = relationship()

