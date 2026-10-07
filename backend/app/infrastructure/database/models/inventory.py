import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.infrastructure.database.models.base import BaseModel

class InventoryMovement(BaseModel):
    __tablename__ = "inventory_movements"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    movement_type: Mapped[str] = mapped_column(String, index=True) # ENTRADA_COMPRA, SALIDA_VENTA, etc.
    quantity: Mapped[float] = mapped_column(Numeric(12, 2))
    previous_stock: Mapped[float] = mapped_column(Numeric(12, 2))
    new_stock: Mapped[float] = mapped_column(Numeric(12, 2))
    
    reason: Mapped[str | None] = mapped_column(String, nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String, nullable=True) # ID de venta o compra asociada

    business: Mapped["Business"] = relationship()
    product: Mapped["Product"] = relationship()
    user: Mapped["User"] = relationship()

class ProductBatch(BaseModel):
    __tablename__ = "product_batches"

    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    
    current_stock: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    product: Mapped["Product"] = relationship(back_populates="batches")

