import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.models.base import BaseModel

class Brand(BaseModel):
    __tablename__ = "brands"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    logo: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    business: Mapped["Business"] = relationship()

