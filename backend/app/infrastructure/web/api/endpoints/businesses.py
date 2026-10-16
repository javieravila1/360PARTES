from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_user
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.business import Business
from app.infrastructure.database.models.business_user import BusinessUser, BusinessRole
from app.infrastructure.database.models.sale import Sale, SaleDetail
from app.infrastructure.database.models.expense import Expense
from app.infrastructure.database.models.debt import Debt
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.inventory import ProductBatch
from app.application.dtos.business import BusinessCreate, BusinessResponse, BusinessWithRoleResponse, BusinessUpdate

router = APIRouter()

@router.post("/", response_model=BusinessResponse)
async def create_business(
    business_in: BusinessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Crear el negocio
    db_business = Business(**business_in.model_dump())
    db.add(db_business)
    await db.flush()  # Para obtener el ID generado sin commitear aÃºn

    # 2. Asociar el usuario actual como OWNER del negocio
    business_user = BusinessUser(
        user_id=current_user.id,
        business_id=db_business.id,
        role=BusinessRole.OWNER
    )
    db.add(business_user)
    
    await db.commit()
    await db.refresh(db_business)
    return db_business

@router.get("/", response_model=List[BusinessWithRoleResponse])
async def read_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Obtener los negocios donde el usuario tiene algÃºn rol
    stmt = (
        select(BusinessUser)
        .where(BusinessUser.user_id == current_user.id)
        .options(selectinload(BusinessUser.business))
    )
    result = await db.execute(stmt)
    business_users = result.scalars().all()
    
    response = []
    for bu in business_users:
        if bu.business.is_active:
            response.append({
                "business": bu.business,
                "role": bu.role
            })
    return response

@router.get("/consolidated-report")
async def get_consolidated_report(
    time_filter: Optional[str] = "all_time",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now()
    parsed_start = None
    parsed_end = None

    if start_date:
        try:
            parsed_start = datetime.strptime(start_date[:10], "%Y-%m-%d")
        except ValueError:
            parsed_start = None

    if end_date:
        try:
            parsed_end = datetime.strptime(end_date[:10], "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            parsed_end = None
    elif parsed_start:
        parsed_end = parsed_start + timedelta(days=1)

    if parsed_start:
        start_date_dt = parsed_start
        end_date_dt = parsed_end
    elif time_filter == 'today':
        start_date_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_dt = start_date_dt + timedelta(days=1)
    elif time_filter == 'this_week':
        start_date_dt = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_dt = start_date_dt + timedelta(days=7)
    elif time_filter == 'this_month':
        start_date_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start_date_dt.month == 12:
            end_date_dt = start_date_dt.replace(year=start_date_dt.year + 1, month=1)
        else:
            end_date_dt = start_date_dt.replace(month=start_date_dt.month + 1)
    elif time_filter == 'this_semester':
        month = 1 if now.month <= 6 else 7
        start_date_dt = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
        if month == 1:
            end_date_dt = start_date_dt.replace(month=7)
        else:
            end_date_dt = start_date_dt.replace(year=start_date_dt.year + 1, month=1)
    elif time_filter == 'this_year':
        start_date_dt = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date_dt = start_date_dt.replace(year=start_date_dt.year + 1)
    else:
        start_date_dt = None
        end_date_dt = None

    start_date_str = start_date_dt.strftime("%Y-%m-%d") if start_date_dt else None
    end_date_str = end_date_dt.strftime("%Y-%m-%d") if end_date_dt else None

    stmt_biz = (
        select(BusinessUser)
        .where(BusinessUser.user_id == current_user.id)
        .options(selectinload(BusinessUser.business))
    )
    result_biz = await db.execute(stmt_biz)
    business_users = [bu for bu in result_biz.scalars().all() if bu.business.is_active]
    business_users.sort(key=lambda bu: (bu.business.name or "").lower())

    reports = []
    totals = {
        "total_sales": 0.0,
        "sales_count": 0,
        "total_expenses": 0.0,
        "total_profit": 0.0,
        "profit_after_expenses": 0.0,
        "inventory_cost": 0.0,
        "inventory_value": 0.0,
        "potential_profit": 0.0,
        "total_products": 0,
        "total_stock": 0,
        "total_payables": 0.0,
        "total_receivables": 0.0,
    }

    for bu in business_users:
        b = bu.business
        b_id = b.id

        cond_sales = [Sale.business_id == b_id]
        cond_expenses = [Expense.business_id == b_id]

        if start_date_str:
            eff_sale_date = func.substr(func.coalesce(Sale.sale_date, cast(Sale.created_at, String)), 1, 10)
            eff_exp_date = func.substr(func.coalesce(cast(Expense.expense_date, String), cast(Expense.created_at, String)), 1, 10)
            cond_sales.append(eff_sale_date >= start_date_str)
            cond_expenses.append(eff_exp_date >= start_date_str)
            if end_date_str:
                cond_sales.append(eff_sale_date < end_date_str)
                cond_expenses.append(eff_exp_date < end_date_str)

        # Sales and count
        stmt_sales = select(func.sum(Sale.total), func.count(Sale.id)).where(*cond_sales)
        res_sales = (await db.execute(stmt_sales)).first()
        b_sales = float(res_sales[0] or 0.0) if res_sales else 0.0
        b_sales_count = int(res_sales[1] or 0) if res_sales else 0

        # Expenses
        stmt_exp = select(func.sum(Expense.amount)).where(*cond_expenses)
        b_expenses = float((await db.execute(stmt_exp)).scalar() or 0.0)

        # Profit
        stmt_profit = (
            select(
                func.sum(SaleDetail.total - (func.coalesce(ProductBatch.cost_price, Product.cost_price, 0) * SaleDetail.quantity))
            )
            .select_from(SaleDetail)
            .join(Sale, Sale.id == SaleDetail.sale_id)
            .outerjoin(Product, SaleDetail.product_id == Product.id)
            .outerjoin(ProductBatch, SaleDetail.batch_id == ProductBatch.id)
            .where(*cond_sales)
        )
        b_profit = float((await db.execute(stmt_profit)).scalar() or 0.0)
        b_profit_after_exp = b_sales - b_expenses

        # Products count
        stmt_prods = select(func.count(Product.id)).where(Product.business_id == b_id)
        b_prods_count = int((await db.execute(stmt_prods)).scalar() or 0)

        # Stock, cost and retail value
        stmt_stock = select(
            func.sum(Product.current_stock),
            func.sum(func.coalesce(Product.cost_price, 0) * func.coalesce(Product.current_stock, 0)),
            func.sum(func.coalesce(Product.selling_price, 0) * func.coalesce(Product.current_stock, 0))
        ).where(Product.business_id == b_id, Product.current_stock > 0)
        res_stock = (await db.execute(stmt_stock)).first()
        b_stock = int(res_stock[0] or 0) if res_stock else 0
        b_inv_cost = float(res_stock[1] or 0.0) if res_stock else 0.0
        b_inv_val = float(res_stock[2] or 0.0) if res_stock else 0.0
        b_pot_profit = max(0.0, b_inv_val - b_inv_cost)

        # Payables
        stmt_pay = select(func.sum(Debt.balance)).where(
            Debt.business_id == b_id,
            Debt.balance > 0,
            Debt.debt_type == 'PAYABLE'
        )
        b_payables = float((await db.execute(stmt_pay)).scalar() or 0.0)

        # Receivables
        stmt_rec = select(func.sum(Debt.balance)).where(
            Debt.business_id == b_id,
            Debt.balance > 0,
            Debt.debt_type == 'RECEIVABLE'
        )
        b_receivables = float((await db.execute(stmt_rec)).scalar() or 0.0)

        biz_data = {
            "business_id": str(b.id),
            "business_name": b.name,
            "role": bu.role,
            "currency": b.currency or "$",
            "total_sales": b_sales,
            "sales_count": b_sales_count,
            "total_expenses": b_expenses,
            "total_profit": b_profit,
            "profit_after_expenses": b_profit_after_exp,
            "inventory_cost": b_inv_cost,
            "inventory_value": b_inv_val,
            "potential_profit": b_pot_profit,
            "total_products": b_prods_count,
            "total_stock": b_stock,
            "total_payables": b_payables,
            "total_receivables": b_receivables,
        }
        reports.append(biz_data)

        totals["total_sales"] += b_sales
        totals["sales_count"] += b_sales_count
        totals["total_expenses"] += b_expenses
        totals["total_profit"] += b_profit
        totals["profit_after_expenses"] += b_profit_after_exp
        totals["inventory_cost"] += b_inv_cost
        totals["inventory_value"] += b_inv_val
        totals["potential_profit"] += b_pot_profit
        totals["total_products"] += b_prods_count
        totals["total_stock"] += b_stock
        totals["total_payables"] += b_payables
        totals["total_receivables"] += b_receivables

    return {
        "period": {
            "time_filter": time_filter,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "generated_at": now.strftime("%Y-%m-%d %H:%M:%S")
        },
        "businesses_count": len(reports),
        "totals": totals,
        "businesses": reports
    }

@router.get("/{business_id}", response_model=BusinessResponse)
async def read_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validar que el usuario pertenece a este negocio
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found")
        
    return business

@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: uuid.UUID,
    business_in: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id,
        BusinessUser.role == BusinessRole.OWNER
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only owners can update business")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business or not business.is_active:
        raise HTTPException(status_code=404, detail="Business not found")
        
    update_data = business_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)
        
    await db.commit()
    await db.refresh(business)
    return business

@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt_role = select(BusinessUser).where(
        BusinessUser.user_id == current_user.id,
        BusinessUser.business_id == business_id,
        BusinessUser.role == BusinessRole.OWNER
    )
    role_result = await db.execute(stmt_role)
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Only owners can delete business")

    stmt = select(Business).where(Business.id == business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    business.is_active = False # Soft delete
    await db.commit()
