from typing import Optional, Dict, Any, List
from pydantic import BaseModel, field_validator
import uuid
from datetime import datetime

class ProductBase(BaseModel):
    brand_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    
    cost_price: float = 0.0
    selling_price: float = 0.0
    wholesale_price: Optional[float] = None
    min_price: Optional[float] = None
    
    track_inventory: bool = True
    current_stock: float = 0.0
    min_stock: float = 0.0
    max_stock: Optional[float] = None
    unit_measure: str = "UN"
    location: Optional[str] = None

    manufacturer_ref: Optional[str] = None
    oem: Optional[str] = None
    part_model: Optional[str] = None
    part_year: Optional[str] = None
    engine_displacement: Optional[str] = None
    compatibility: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

    @field_validator('name', 'description', 'sku', 'barcode', 'notes', 'manufacturer_ref', 'oem', 'part_model', 'unit_measure', mode='before')
    @classmethod
    def to_upper(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

class ProductCreate(ProductBase):
    # Negocios adicionales (además del activo) donde también se creará el producto
    extra_business_ids: List[uuid.UUID] = []

class ProductUpdate(ProductBase):
    name: Optional[str] = None

class ProductBatchResponse(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    product_id: uuid.UUID
    current_stock: float
    cost_price: float
    selling_price: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    batches: List[ProductBatchResponse] = []

    class Config:
        from_attributes = True

