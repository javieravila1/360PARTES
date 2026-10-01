import enum
import uuid
from sqlalchemy import ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import BaseModel

class BusinessRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"

class BusinessUser(BaseModel):
    __tablename__ = "business_users"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    role: Mapped[BusinessRole] = mapped_column(Enum(BusinessRole), default=BusinessRole.EMPLOYEE)

    user: Mapped["User"] = relationship(back_populates="business_users")
    business: Mapped["Business"] = relationship(back_populates="users")

