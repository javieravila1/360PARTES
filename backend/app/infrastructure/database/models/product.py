import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.infrastructure.database.models.base import BaseModel

class Product(BaseModel):
    __tablename__ = "products"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    brand_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # Basic info
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    sku: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    barcode: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    image: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Commercial info
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    wholesale_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    min_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    
    # Inventory control
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    current_stock: Mapped[float] = mapped_column(Numeric(12, 2), default=0) # Can be float for things like liters
    min_stock: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    max_stock: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    unit_measure: Mapped[str | None] = mapped_column(String, default="UN")
    location: Mapped[str | None] = mapped_column(String, nullable=True)

    # Spare parts specific info
    manufacturer_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    oem: Mapped[str | None] = mapped_column(String, nullable=True)
    part_model: Mapped[str | None] = mapped_column(String, nullable=True) # Modelo de moto compatible
    part_year: Mapped[str | None] = mapped_column(String, nullable=True)  # AÃ±o
    engine_displacement: Mapped[str | None] = mapped_column(String, nullable=True) # Cilindraje
    compatibility: Mapped[dict | None] = mapped_column(JSONB, nullable=True) # JSON para guardar mÃºltiples compatibilidades
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    business: Mapped["Business"] = relationship()
    brand: Mapped["Brand"] = relationship()
    category: Mapped["Category"] = relationship()

