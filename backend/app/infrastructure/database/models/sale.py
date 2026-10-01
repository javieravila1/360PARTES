import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import List
from app.infrastructure.database.models.base import BaseModel

class Sale(BaseModel):
    __tablename__ = "sales"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sale_date: Mapped[str | None] = mapped_column(String, nullable=True)
    
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    payment_method: Mapped[str] = mapped_column(String) # CASH, CARD, TRANSFER, CREDIT
    payment_status: Mapped[str] = mapped_column(String) # PAID, PENDING, PARTIAL
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(String, nullable=True) # PDF on MinIO

    business: Mapped["Business"] = relationship()
    customer: Mapped["Customer"] = relationship()
    user: Mapped["User"] = relationship()
    details: Mapped[List["SaleDetail"]] = relationship(back_populates="sale", cascade="all, delete-orphan")

class SaleDetail(BaseModel):
    __tablename__ = "sale_details"

    sale_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 2))
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2))

    sale: Mapped["Sale"] = relationship(back_populates="details")
    product: Mapped["Product"] = relationship()

