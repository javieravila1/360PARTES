import uuid
from sqlalchemy import String, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.infrastructure.database.models.base import BaseModel

class CashSession(BaseModel):
    __tablename__ = "cash_sessions"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    expected_cash: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    actual_cash: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    difference: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(String, default="OPEN")

    business: Mapped["Business"] = relationship()
    user: Mapped["User"] = relationship()

