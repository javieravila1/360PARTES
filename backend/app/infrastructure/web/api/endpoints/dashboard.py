
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from datetime import datetime
import uuid

from app.core.database import get_db
from app.infrastructure.web.api.deps import get_current_business_id
from app.infrastructure.database.models.sale import Sale, SaleDetail
from app.infrastructure.database.models.product import Product
from app.infrastructure.database.models.expense import Expense
from app.infrastructure.database.models.debt import Debt
from app.infrastructure.database.models.inventory import ProductBatch

from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
async def get_dashboard_metrics(
    time_filter: str = None,
    chart_time_filter: str = 'all_time',
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    start_date = None
    end_date = None
    if time_filter == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
    elif time_filter == 'this_week':
        # Consider week starts on Monday
        start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)
    elif time_filter == 'this_month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start_date.month == 12:
            end_date = start_date.replace(year=start_date.year + 1, month=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1)
    elif time_filter == 'this_semester':
        month = 1 if now.month <= 6 else 7
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
        if month == 1:
            end_date = start_date.replace(month=7)
        else:
            end_date = start_date.replace(year=start_date.year + 1, month=1)
    elif time_filter == 'this_year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date.replace(year=start_date.year + 1)

    from sqlalchemy import cast, String
    cond_sales = [Sale.business_id == business_id]
    cond_expenses = [Expense.business_id == business_id]

    if start_date:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d") if end_date else None
        
        # Filtrar por fecha manual si existe, si no por fecha de creación (substr extrae YYYY-MM-DD)
        eff_sale_date = func.substr(func.coalesce(Sale.sale_date, cast(Sale.created_at, String)), 1, 10)
        eff_exp_date = func.substr(func.coalesce(cast(Expense.expense_date, String), cast(Expense.created_at, String)), 1, 10)
        
        cond_sales.append(eff_sale_date >= start_date_str)
        cond_expenses.append(eff_exp_date >= start_date_str)
        
        if end_date_str:
            cond_sales.append(eff_sale_date < end_date_str)
            cond_expenses.append(eff_exp_date < end_date_str)

    # Ventas Totales
    stmt_sales = select(func.sum(Sale.total)).where(*cond_sales)
    result_sales = await db.execute(stmt_sales)
    total_sales = result_sales.scalar() or 0.0

    # Total Productos (Static)
    stmt_products = select(func.count(Product.id)).where(Product.business_id == business_id)
    result_products = await db.execute(stmt_products)
    total_products = result_products.scalar() or 0

    # Ganancia (Profit) = Total Venta Detalle - (Costo * Cantidad)
    stmt_profit = select(
        func.sum(SaleDetail.total - (func.coalesce(ProductBatch.cost_price, Product.cost_price, 0) * SaleDetail.quantity))
    ).select_from(SaleDetail).join(
        Sale, Sale.id == SaleDetail.sale_id
    ).outerjoin(
        Product, SaleDetail.product_id == Product.id
    ).outerjoin(
        ProductBatch, SaleDetail.batch_id == ProductBatch.id
    ).where(*cond_sales)
    
    result_profit = await db.execute(stmt_profit)
    total_profit = result_profit.scalar() or 0.0

    # Payables (Static)
    stmt_payables = select(func.sum(Debt.balance)).where(
        Debt.business_id == business_id, 
        Debt.balance > 0,
        Debt.debt_type == 'PAYABLE'
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
    stmt_top = select(Product.name, func.sum(SaleDetail.quantity).label('qty'))\
        .select_from(Product)\
        .join(SaleDetail, Product.id == SaleDetail.product_id)\
        .join(Sale, Sale.id == SaleDetail.sale_id)\
        .where(Product.business_id == business_id, *cond_sales)\
        .group_by(Product.id, Product.name)\
        .order_by(desc('qty')).limit(5)
    res_top = await db.execute(stmt_top)
    top_sold = [{"name": r.name, "quantity": r.qty} for r in res_top.all()]

    # Least Sold
    stmt_least = select(Product.name, func.sum(SaleDetail.quantity).label('qty'))\
        .select_from(Product)\
        .join(SaleDetail, Product.id == SaleDetail.product_id)\
        .join(Sale, Sale.id == SaleDetail.sale_id)\
        .where(Product.business_id == business_id, *cond_sales)\
        .group_by(Product.id, Product.name)\
        .order_by(asc('qty')).limit(5)
    res_least = await db.execute(stmt_least)
    least_sold = [{"name": r.name, "quantity": r.qty} for r in res_least.all()]

    # Recent Activity (Sales + Expenses)
    eff_sale_date_sort = func.substr(func.coalesce(Sale.sale_date, cast(Sale.created_at, String)), 1, 10)
    stmt_recent_sales = select(Sale.total, eff_sale_date_sort.label("eff_date")).where(*cond_sales).order_by(desc(eff_sale_date_sort)).limit(5)
    res_recent_sales = await db.execute(stmt_recent_sales)
    sales_activity = [{"type": "Venta", "amount": float(r.total), "date": r.eff_date} for r in res_recent_sales.all()]

    eff_exp_date_sort = func.substr(func.coalesce(cast(Expense.expense_date, String), cast(Expense.created_at, String)), 1, 10)
    stmt_recent_exp = select(Expense.amount, eff_exp_date_sort.label("eff_date"), Expense.category).where(*cond_expenses).order_by(desc(eff_exp_date_sort)).limit(5)
    res_recent_exp = await db.execute(stmt_recent_exp)
    exp_activity = [{"type": f"Gasto ({r.category})", "amount": float(r.amount), "date": r.eff_date} for r in res_recent_exp.all()]

    combined_activity = sales_activity + exp_activity
    combined_activity.sort(key=lambda x: str(x['date']), reverse=True)
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

    # Valor Inventario (Static)
    stmt_inv_value = select(func.sum(Product.cost_price * Product.current_stock)).where(Product.business_id == business_id)
    result_inv_value = await db.execute(stmt_inv_value)
    inventory_value = result_inv_value.scalar() or 0.0

    # Sales Chart (Dynamic based on chart_time_filter)
    eff_sale_date_group = func.substr(func.coalesce(Sale.sale_date, cast(Sale.created_at, String)), 1, 10)
    
    chart_start_date = None
    chart_end_date = None
    
    if chart_time_filter == 'today':
        chart_start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        chart_end_date = chart_start_date + timedelta(days=1)
    elif chart_time_filter == 'this_week':
        chart_start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        chart_end_date = chart_start_date + timedelta(days=7)
    elif chart_time_filter == 'this_month':
        chart_start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if chart_start_date.month == 12:
            chart_end_date = chart_start_date.replace(year=chart_start_date.year + 1, month=1)
        else:
            chart_end_date = chart_start_date.replace(month=chart_start_date.month + 1)
    elif chart_time_filter == 'this_semester':
        month = 1 if now.month <= 6 else 7
        chart_start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
        if month == 1:
            chart_end_date = chart_start_date.replace(month=7)
        else:
            chart_end_date = chart_start_date.replace(year=chart_start_date.year + 1, month=1)
    elif chart_time_filter == 'this_year':
        chart_start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        chart_end_date = chart_start_date.replace(year=chart_start_date.year + 1)
    elif chart_time_filter == 'all_time' or not chart_time_filter:
        stmt_first = select(func.min(eff_sale_date_group)).where(Sale.business_id == business_id)
        first_res = await db.execute(stmt_first)
        first_str = first_res.scalar()
        if first_str:
            chart_start_date = datetime.strptime(first_str[:10], "%Y-%m-%d")
        else:
            chart_start_date = now - timedelta(days=30)
        chart_end_date = now + timedelta(days=1)
    else:
        # Fallback to 30 days
        chart_start_date = now - timedelta(days=30)
        chart_end_date = now + timedelta(days=1)

    # Asegurar que haya al menos 7 días de diferencia para poder dibujar una línea en la gráfica
    if (chart_end_date - chart_start_date).days < 7:
        chart_start_date = chart_end_date - timedelta(days=7)

    chart_start_str = chart_start_date.strftime("%Y-%m-%d")
    chart_end_str = chart_end_date.strftime("%Y-%m-%d")
    
    stmt_chart = (
        select(
            eff_sale_date_group.label("day"),
            func.sum(Sale.total).label("daily_total")
        )
        .where(
            Sale.business_id == business_id,
            eff_sale_date_group >= chart_start_str,
            eff_sale_date_group < chart_end_str
        )
        .group_by(eff_sale_date_group)
        .order_by(asc(eff_sale_date_group))
    )
    res_chart = await db.execute(stmt_chart)
    sales_map = {str(r.day): float(r.daily_total) for r in res_chart.all()}
    
    sales_chart = []
    # Generar días para la gráfica (no más allá de hoy para evitar ver el futuro vacío, a menos que haya start_date futuro, lo cual es raro)
    current_day = chart_start_date
    today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    limit_day = min(chart_end_date, today_midnight + timedelta(days=1))
    
    while current_day < limit_day:
        day_str = current_day.strftime("%Y-%m-%d")
        sales_chart.append({
            "date": day_str,
            "total": sales_map.get(day_str, 0.0)
        })
        current_day += timedelta(days=1)

    # Upcoming Payables (Alerts)
    seven_days_from_now = now.date() + timedelta(days=7)
    stmt_alerts = select(Debt).where(
        Debt.business_id == business_id,
        Debt.debt_type == 'PAYABLE',
        Debt.balance > 0,
        Debt.due_date != None,
        Debt.due_date <= seven_days_from_now
    ).order_by(asc(Debt.due_date))
    
    res_alerts = await db.execute(stmt_alerts)
    payable_alerts = []
    for p in res_alerts.scalars().all():
        payable_alerts.append({
            "supplier_name": p.contact_name or "Desconocido",
            "balance": float(p.balance),
            "due_date": str(p.due_date),
            "is_overdue": p.due_date < now.date() if p.due_date else False
        })

    return {
        "total_sales": float(total_sales),
        "total_products": total_products,
        "total_profit": float(total_profit),
        "total_payables": float(total_payables),
        "total_expenses": float(total_expenses),
        "total_suppliers": total_suppliers,
        "inventory_value": float(inventory_value),
        "low_stock": low_stock_products,
        "top_sold": top_sold,
        "least_sold": least_sold,
        "recent_activity": recent_activity,
        "sales_chart": sales_chart,
        "payable_alerts": payable_alerts
    }
