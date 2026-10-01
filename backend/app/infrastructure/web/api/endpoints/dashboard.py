
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from datetime import datetime
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.database.models.sale import Sale, SaleDetail
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.payable import AccountPayable
from app.infrastructure.database.models.expense import Expense

from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
async def get_dashboard_metrics(
    time_filter: str = None,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    start_date = None
    if time_filter == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == 'this_week':
        start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == 'this_month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == 'this_semester':
        month = 1 if now.month <= 6 else 7
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == 'this_year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    cond_sales = [Sale.business_id == business_id]
    cond_sale_details = [Product.business_id == business_id]
    cond_expenses = [Expense.business_id == business_id]

    if start_date:
        cond_sales.append(Sale.created_at >= start_date)
        cond_sale_details.append(SaleDetail.created_at >= start_date)
        cond_expenses.append(Expense.created_at >= start_date)

    # Ventas Totales
    stmt_sales = select(func.sum(Sale.total)).where(*cond_sales)
    result_sales = await db.execute(stmt_sales)
    total_sales = result_sales.scalar() or 0.0

    # Total Productos (Static)
    stmt_products = select(func.count(Product.id)).where(Product.business_id == business_id)
    result_products = await db.execute(stmt_products)
    total_products = result_products.scalar() or 0

    # Valor Inventario (Static)
    stmt_inventory_value = select(func.sum(Product.current_stock * Product.cost_price)).where(
        Product.business_id == business_id, Product.current_stock > 0
    )
    result_value = await db.execute(stmt_inventory_value)
    inventory_value = result_value.scalar() or 0.0

    # Payables (Static)
    stmt_payables = select(func.sum(AccountPayable.balance)).where(
        AccountPayable.business_id == business_id, AccountPayable.balance > 0
    )
    result_payables = await db.execute(stmt_payables)
    total_payables = result_payables.scalar() or 0.0

    # Low Stock (Static)
    stmt_low_stock = select(Product).where(
        Product.business_id == business_id,
        Product.current_stock <= 5,
        Product.track_inventory == True
    ).limit(5)
    result_low_stock = await db.execute(stmt_low_stock)
    low_stock_products = [{"name": p.name, "stock": p.current_stock} for p in result_low_stock.scalars().all()]

    # Top Sold
    stmt_top = select(Product.name, func.sum(SaleDetail.quantity).label('qty')).select_from(Product).join(SaleDetail, Product.id == SaleDetail.product_id).where(*cond_sale_details).group_by(Product.id, Product.name).order_by(desc('qty')).limit(5)
    res_top = await db.execute(stmt_top)
    top_sold = [{"name": r.name, "quantity": r.qty} for r in res_top.all()]

    # Least Sold
    stmt_least = select(Product.name, func.sum(SaleDetail.quantity).label('qty')).select_from(Product).join(SaleDetail, Product.id == SaleDetail.product_id).where(*cond_sale_details).group_by(Product.id, Product.name).order_by(asc('qty')).limit(5)
    res_least = await db.execute(stmt_least)
    least_sold = [{"name": r.name, "quantity": r.qty} for r in res_least.all()]

    # Recent Activity (Sales + Expenses)
    stmt_recent_sales = select(Sale.total, Sale.created_at).where(*cond_sales).order_by(desc(Sale.created_at)).limit(5)
    res_recent_sales = await db.execute(stmt_recent_sales)
    sales_activity = [{"type": "Venta", "amount": float(r.total), "date": r.created_at} for r in res_recent_sales.all()]

    stmt_recent_exp = select(Expense.amount, Expense.expense_date, Expense.category).where(*cond_expenses).order_by(desc(Expense.created_at)).limit(5)
    res_recent_exp = await db.execute(stmt_recent_exp)
    exp_activity = [{"type": f"Gasto ({r.category})", "amount": float(r.amount), "date": r.expense_date} for r in res_recent_exp.all()]

    combined_activity = sales_activity + exp_activity
    combined_activity.sort(key=lambda x: x['date'].isoformat() if hasattr(x['date'], 'isoformat') else str(x['date']), reverse=True)
    recent_activity = combined_activity[:7]

    # Gastos Totales
    stmt_expenses = select(func.sum(Expense.amount)).where(*cond_expenses)
    result_expenses = await db.execute(stmt_expenses)
    total_expenses = result_expenses.scalar() or 0.0

    # Total Proveedores (Static)
    from app.infrastructure.database.models.contacts import Supplier
    stmt_suppliers = select(func.count(Supplier.id)).where(Supplier.business_id == business_id)
    result_suppliers = await db.execute(stmt_suppliers)
    total_suppliers = result_suppliers.scalar() or 0

    # Sales Chart (Last 30 days)
    thirty_days_ago = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)
    stmt_chart = (
        select(
            func.date(Sale.created_at).label("day"),
            func.sum(Sale.total).label("daily_total")
        )
        .where(Sale.business_id == business_id, Sale.created_at >= thirty_days_ago)
        .group_by(func.date(Sale.created_at))
        .order_by(asc("day"))
    )
    res_chart = await db.execute(stmt_chart)
    sales_map = {str(r.day): float(r.daily_total) for r in res_chart.all()}
    
    sales_chart = []
    for i in range(30, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_str = str(day_date)
        sales_chart.append({
            "date": day_str,
            "total": sales_map.get(day_str, 0.0)
        })

    return {
        "total_sales": float(total_sales),
        "total_products": total_products,
        "inventory_value": float(inventory_value),
        "total_payables": float(total_payables),
        "total_expenses": float(total_expenses),
        "total_suppliers": total_suppliers,
        "low_stock": low_stock_products,
        "top_sold": top_sold,
        "least_sold": least_sold,
        "recent_activity": recent_activity,
        "sales_chart": sales_chart
    }
