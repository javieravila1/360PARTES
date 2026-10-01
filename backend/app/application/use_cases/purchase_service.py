import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.application.dtos.purchase_dto import PurchaseCreateDTO
from app.infrastructure.database.models.purchase import Purchase, PurchaseDetail
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.inventory import InventoryMovement
from app.infrastructure.database.models.payable import AccountPayable
from app.infrastructure.database.models.user import User

class PurchaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_purchase(self, business_id: uuid.UUID, current_user: User, dto: PurchaseCreateDTO) -> Purchase:
        try:
            # 1. Crear cabecera de compra
            db_purchase = Purchase(
                business_id=business_id,
                supplier_id=dto.supplier_id,
                user_id=current_user.id,
                invoice_number=dto.invoice_number,
                purchase_date=dto.purchase_date,
                due_date=dto.due_date,
                subtotal=dto.subtotal,
                discount=dto.discount,
                tax=dto.tax,
                total=dto.total,
                payment_method=dto.payment_method,
                payment_status=dto.payment_status,
                notes=dto.notes
            )
            self.db.add(db_purchase)
            await self.db.flush()

            # 2. Detalles, Stock y Movimientos
            for detail in dto.details:
                stmt = select(Product).where(Product.id == detail.product_id, Product.business_id == business_id)
                res = await self.db.execute(stmt)
                product = res.scalar_one_or_none()

                if not product:
                    raise ValueError(f"Producto {detail.product_id} no encontrado")

                # Detalle
                db_detail = PurchaseDetail(
                    purchase_id=db_purchase.id,
                    product_id=product.id,
                    quantity=detail.quantity,
                    unit_cost=detail.unit_cost,
                    discount=detail.discount,
                    total=(detail.quantity * detail.unit_cost) - detail.discount
                )
                self.db.add(db_detail)

                # Actualizar costo y stock
                previous_stock = product.current_stock
                product.current_stock += detail.quantity
                
                # Actualizar el costo del producto (Opcional: Promedio ponderado, aquí asignación directa para simplificar)
                product.cost_price = detail.unit_cost

                # Movimiento de inventario
                movement = InventoryMovement(
                    business_id=business_id,
                    product_id=product.id,
                    user_id=current_user.id,
                    movement_type="ENTRADA_COMPRA",
                    quantity=detail.quantity,
                    previous_stock=previous_stock,
                    new_stock=product.current_stock,
                    reference_id=str(db_purchase.id)
                )
                self.db.add(movement)

            # 3. Crear Cuenta por Pagar si aplica (Pago a crédito o parcial)
            if dto.payment_status in ['PENDING', 'PARTIAL']:
                if not dto.supplier_id:
                    raise ValueError("Se requiere un proveedor para registrar compras a crédito")
                if not dto.due_date:
                    raise ValueError("Se requiere una fecha de vencimiento para créditos")
                
                balance = dto.total - dto.amount_paid
                db_payable = AccountPayable(
                    business_id=business_id,
                    supplier_id=dto.supplier_id,
                    purchase_id=db_purchase.id,
                    total_amount=dto.total,
                    paid_amount=dto.amount_paid,
                    balance=balance,
                    due_date=dto.due_date,
                    status="PARTIAL" if dto.amount_paid > 0 else "PENDING"
                )
                self.db.add(db_payable)

            await self.db.commit()
            await self.db.refresh(db_purchase)
            return db_purchase

        except Exception as e:
            await self.db.rollback()
            raise e

    async def get_purchases(self, business_id: uuid.UUID) -> List[Purchase]:
        stmt = select(Purchase).where(Purchase.business_id == business_id).order_by(Purchase.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()
