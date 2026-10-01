from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id, get_current_user
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.sale import Sale, SaleDetail
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.inventory import InventoryMovement
from app.application.dtos.sale import SaleCreate, SaleResponse

router = APIRouter()

@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale_in: SaleCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Crear Venta
        db_sale = Sale(
            business_id=business_id,
            user_id=current_user.id,
            customer_id=sale_in.customer_id,
            subtotal=sale_in.subtotal,
            discount=sale_in.discount,
            tax=sale_in.tax,
            total=sale_in.total,
            payment_method=sale_in.payment_method,
            payment_status=sale_in.payment_status,
            notes=sale_in.notes,
            sale_date=sale_in.sale_date
        )
        db.add(db_sale)
        await db.flush() # Para obtener ID
        
        # 2. Detalles, Stock y Movimientos
        for detail in sale_in.details:
            # Obtener producto
            stmt = select(Product).where(Product.id == detail.product_id, Product.business_id == business_id)
            result = await db.execute(stmt)
            product = result.scalar_one_or_none()
            
            if not product:
                raise HTTPException(status_code=400, detail=f"Product {detail.product_id} not found")
            
            if product.track_inventory and product.current_stock < detail.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}. Disponible: {product.current_stock}")
            
            # Detalle
            from decimal import Decimal as D
            qty = D(str(detail.quantity))
            unit_price = D(str(detail.unit_price))
            discount = D(str(detail.discount))

            db_detail = SaleDetail(
                sale_id=db_sale.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
                discount=discount,
                total=(qty * unit_price) - discount
            )
            db.add(db_detail)
            
            if product.track_inventory:
                previous_stock = product.current_stock
                product.current_stock = product.current_stock - qty
                
                # Movimiento
                movement = InventoryMovement(
                    business_id=business_id,
                    product_id=product.id,
                    user_id=current_user.id,
                    movement_type="SALIDA_VENTA",
                    quantity=qty,
                    previous_stock=previous_stock,
                    new_stock=product.current_stock,
                    reference_id=str(db_sale.id)
                )
                db.add(movement)

        # 3. TODO: Crear cuenta por cobrar si el pago es parcial o a crÃ©dito.

        await db.commit()
        await db.refresh(db_sale)
        return db_sale
    except Exception as e:
        await db.rollback()
        raise e

from sqlalchemy.orm import selectinload

@router.get("/", response_model=List[dict])
async def read_sales(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Sale).options(
        selectinload(Sale.details).selectinload(SaleDetail.product)
    ).where(Sale.business_id == business_id).order_by(Sale.created_at.desc())
    result = await db.execute(stmt)
    sales = result.scalars().all()
    
    # Return as dict to easily serialize relationships without complex Pydantic config
    out = []
    for s in sales:
        s_dict = {
            "id": str(s.id),
            "created_at": s.created_at,
            "sale_date": s.sale_date,
            "total": float(s.total),
            "payment_method": s.payment_method,
            "details": []
        }
        for d in s.details:
            s_dict["details"].append({
                "product_name": d.product.name if d.product else "Producto Eliminado",
                "quantity": float(d.quantity),
                "unit_price": float(d.unit_price),
                "total": float(d.total)
            })
        out.append(s_dict)
    
    return out

