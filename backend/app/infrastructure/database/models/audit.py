import uuid
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
from app.infrastructure.database.models.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action: Mapped[str] = mapped_column(String, index=True) # CREATE_PRODUCT, DELETE_SALE, etc.
    entity: Mapped[str] = mapped_column(String, index=True) # Product, Sale, Purchase, etc.
    entity_id: Mapped[str] = mapped_column(String, index=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True) # Cambios realizados
    
    business: Mapped["Business"] = relationship()
    user: Mapped["User"] = relationship()

