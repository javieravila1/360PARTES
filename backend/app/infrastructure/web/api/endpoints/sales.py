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
from app.infrastructure.database.models.inventory import InventoryMovement, ProductBatch
from app.application.dtos.sale import SaleCreate, SaleResponse

from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()

@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale_in: SaleCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Generar invoice_number con fecha y hora de Colombia
        invoice_number = datetime.now(ZoneInfo('America/Bogota')).strftime('%Y%m%d%H%M%S')
        
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
            sale_date=sale_in.sale_date,
            invoice_number=invoice_number
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
                batch_id=detail.batch_id,
                quantity=qty,
                unit_price=unit_price,
                discount=discount,
                total=(qty * unit_price) - discount
            )
            db.add(db_detail)
            
            if detail.batch_id:
                batch_stmt = select(ProductBatch).where(ProductBatch.id == detail.batch_id, ProductBatch.business_id == business_id)
                batch_res = await db.execute(batch_stmt)
                batch = batch_res.scalar_one_or_none()
                if not batch:
                    raise HTTPException(status_code=400, detail=f"Batch {detail.batch_id} not found")
                batch.current_stock = float(batch.current_stock) - float(qty)
            
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
            "invoice_number": s.invoice_number,
            "created_at": s.created_at,
            "sale_date": s.sale_date,
            "total": float(s.total),
            "payment_method": s.payment_method,
            "details": []
        }
        for d in s.details:
            s_dict["details"].append({
                "id": str(d.id),
                "product_name": d.product.name if d.product else "Producto Eliminado",
                "quantity": float(d.quantity),
                "unit_price": float(d.unit_price),
                "total": float(d.total)
            })
        out.append(s_dict)
    
    return out
from pydantic import BaseModel

class ReturnItem(BaseModel):
    sale_detail_id: uuid.UUID
    quantity: float

class ReturnRequest(BaseModel):
    items: List[ReturnItem]
    notes: str = ""

@router.post("/{sale_id}/return", status_code=status.HTTP_200_OK)
async def process_return(
    sale_id: uuid.UUID,
    return_req: ReturnRequest,
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Sale).where(Sale.id == sale_id, Sale.business_id == business_id)
    sale = (await db.execute(stmt)).scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    for ret_item in return_req.items:
        detail_stmt = select(SaleDetail).where(SaleDetail.id == ret_item.sale_detail_id, SaleDetail.sale_id == sale_id)
        detail = (await db.execute(detail_stmt)).scalar_one_or_none()
        
        if not detail:
            continue
            
        if ret_item.quantity <= 0 or ret_item.quantity > float(detail.quantity):
            raise HTTPException(status_code=400, detail="Invalid return quantity")
            
        # Reducir de la venta
        detail.quantity = float(detail.quantity) - ret_item.quantity
        amount_to_reduce = ret_item.quantity * float(detail.unit_price)
        detail.total = float(detail.total) - amount_to_reduce
        
        # Reducir del total de la factura
        sale.total = float(sale.total) - amount_to_reduce
        sale.subtotal = float(sale.subtotal) - amount_to_reduce
        
        # Restaurar stock
        if detail.product_id:
            prod_stmt = select(Product).where(Product.id == detail.product_id)
            product = (await db.execute(prod_stmt)).scalar_one_or_none()
            
            if product:
                previous_stock = product.current_stock
                product.current_stock = float(product.current_stock) + ret_item.quantity
                
                if detail.batch_id:
                    batch_stmt = select(ProductBatch).where(ProductBatch.id == detail.batch_id)
                    batch = (await db.execute(batch_stmt)).scalar_one_or_none()
                    if batch:
                        batch.current_stock = float(batch.current_stock) + ret_item.quantity
                
                # Movimiento de inventario
                mov = InventoryMovement(
                    business_id=business_id,
                    product_id=product.id,
                    user_id=current_user.id,
                    movement_type="DEVOLUCION_VENTA",
                    quantity=ret_item.quantity,
                    previous_stock=previous_stock,
                    new_stock=product.current_stock,
                    reference_id=str(sale.id)
                )
                db.add(mov)

    sale.notes = (sale.notes or "") + f" | DEVOLUCIÓN: {return_req.notes}"
    if float(sale.total) <= 0:
        sale.payment_status = "REFUNDED"
    
    await db.commit()
    return {"status": "ok"}
