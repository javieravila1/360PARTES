import uuid
from sqlalchemy import String, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.models.base import BaseModel
from datetime import date

class Expense(BaseModel):
    __tablename__ = "expenses"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    
    category: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    expense_date: Mapped[date] = mapped_column(Date)
    
    payment_method: Mapped[str] = mapped_column(String)
    receipt_url: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    business: Mapped["Business"] = relationship()
    user: Mapped["User"] = relationship()
    supplier: Mapped["Supplier"] = relationship()

