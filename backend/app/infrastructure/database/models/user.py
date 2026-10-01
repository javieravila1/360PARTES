import enum
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.infrastructure.database.models.base import BaseModel

class UserRoleGlobal(str, enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    USER = "USER"

class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    global_role: Mapped[UserRoleGlobal] = mapped_column(Enum(UserRoleGlobal), default=UserRoleGlobal.USER)

    business_users: Mapped[List["BusinessUser"]] = relationship(back_populates="user", cascade="all, delete-orphan")

