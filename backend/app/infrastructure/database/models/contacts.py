import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.models.base import BaseModel

class Customer(BaseModel):
    __tablename__ = "customers"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    document_type: Mapped[str | None] = mapped_column(String, nullable=True)
    document_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    business: Mapped["Business"] = relationship()

class Supplier(BaseModel):
    __tablename__ = "suppliers"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    company_name: Mapped[str] = mapped_column(String, index=True)
    document_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    contact_person: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    business: Mapped["Business"] = relationship()

