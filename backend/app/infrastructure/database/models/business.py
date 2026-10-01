from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.infrastructure.database.models.base import BaseModel

class Business(BaseModel):
    __tablename__ = "businesses"

    name: Mapped[str] = mapped_column(String, index=True)
    logo: Mapped[str | None] = mapped_column(String, nullable=True)
    document_id: Mapped[str | None] = mapped_column(String, nullable=True)  # NIT / CÃ©dula
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="COP")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    users: Mapped[List["BusinessUser"]] = relationship(back_populates="business", cascade="all, delete-orphan")

