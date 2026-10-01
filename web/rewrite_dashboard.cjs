const fs = require('fs');

// --- 1. REWRITE DASHBOARD.PY ---
const dashboardPy = `
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

router = APIRouter()

@router.get("/")
async def get_dashboard_metrics(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: AsyncSession = Depends(get_db)
):
    # Ventas Totales
    stmt_sales = select(func.sum(Sale.total)).where(Sale.business_id == business_id)
    result_sales = await db.execute(stmt_sales)
    total_sales = result_sales.scalar() or 0.0

    # Total Productos
    stmt_products = select(func.count(Product.id)).where(Product.business_id == business_id)
    result_products = await db.execute(stmt_products)
    total_products = result_products.scalar() or 0

    # Valor Inventario
    stmt_inventory_value = select(func.sum(Product.current_stock * Product.cost_price)).where(
        Product.business_id == business_id, Product.current_stock > 0
    )
    result_value = await db.execute(stmt_inventory_value)
    inventory_value = result_value.scalar() or 0.0

    # Payables
    stmt_payables = select(func.sum(AccountPayable.balance)).where(
        AccountPayable.business_id == business_id, AccountPayable.balance > 0
    )
    result_payables = await db.execute(stmt_payables)
    total_payables = result_payables.scalar() or 0.0

    # Low Stock (stock <= min_stock or <= 5)
    stmt_low_stock = select(Product).where(
        Product.business_id == business_id,
        Product.current_stock <= 5,
        Product.track_inventory == True
    ).limit(5)
    result_low_stock = await db.execute(stmt_low_stock)
    low_stock_products = [{"name": p.name, "stock": p.current_stock} for p in result_low_stock.scalars().all()]

    # Top Sold
    stmt_top = select(Product.name, func.sum(SaleDetail.quantity).label('qty')).select_from(Product).join(SaleDetail, Product.id == SaleDetail.product_id).where(Product.business_id == business_id).group_by(Product.id, Product.name).order_by(desc('qty')).limit(5)
    res_top = await db.execute(stmt_top)
    top_sold = [{"name": r.name, "quantity": r.qty} for r in res_top.all()]

    # Least Sold
    stmt_least = select(Product.name, func.sum(SaleDetail.quantity).label('qty')).select_from(Product).join(SaleDetail, Product.id == SaleDetail.product_id).where(Product.business_id == business_id).group_by(Product.id, Product.name).order_by(asc('qty')).limit(5)
    res_least = await db.execute(stmt_least)
    least_sold = [{"name": r.name, "quantity": r.qty} for r in res_least.all()]

    # Recent Activity (Sales + Expenses)
    stmt_recent_sales = select(Sale.total, Sale.created_at).where(Sale.business_id == business_id).order_by(desc(Sale.created_at)).limit(5)
    res_recent_sales = await db.execute(stmt_recent_sales)
    sales_activity = [{"type": "Venta", "amount": float(r.total), "date": r.created_at} for r in res_recent_sales.all()]

    stmt_recent_exp = select(Expense.amount, Expense.expense_date, Expense.category).where(Expense.business_id == business_id).order_by(desc(Expense.created_at)).limit(5)
    res_recent_exp = await db.execute(stmt_recent_exp)
    exp_activity = [{"type": f"Gasto ({r.category})", "amount": float(r.amount), "date": r.expense_date} for r in res_recent_exp.all()]

    # Combine and sort recent activity
    combined_activity = sales_activity + exp_activity
    # simple sort by converting to string/date, here just returning first 5 combined
    recent_activity = combined_activity[:7]

    return {
        "total_sales": float(total_sales),
        "total_products": total_products,
        "inventory_value": float(inventory_value),
        "total_payables": float(total_payables),
        "low_stock": low_stock_products,
        "top_sold": top_sold,
        "least_sold": least_sold,
        "recent_activity": recent_activity
    }
`;

fs.writeFileSync('../backend/app/infrastructure/web/api/endpoints/dashboard.py', dashboardPy, 'utf8');

// --- 2. REWRITE DASHBOARD.TSX ---
const dashboardTsx = `
import { useEffect, useState } from 'react';
import { useBusinessStore } from '../store/businessStore';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import { DollarSign, Package, CreditCard, TrendingUp, Activity, ShoppingBag, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [metrics, setMetrics] = useState<any>({
    total_sales: 0, total_products: 0, inventory_value: 0, total_payables: 0,
    low_stock: [], top_sold: [], least_sold: [], recent_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await apiClient.get('/dashboard/');
        setMetrics(data);
      } catch (error) {
        toast.error('Error al cargar métricas del dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (currentBusiness) fetchMetrics();
  }, [currentBusiness]);

  return (
    <div className="font-sans text-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumen General</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{currentBusiness?.name}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Activity size={18} className="text-emerald-500" />
          <span className="text-sm font-bold">Sistema En Línea</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 p-3 rounded-2xl w-fit mb-4"><TrendingUp size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Ventas Totales</h3>
              <p className="text-3xl font-black mt-1">\${metrics.total_sales.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 p-3 rounded-2xl w-fit mb-4"><DollarSign size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Valor Inventario</h3>
              <p className="text-3xl font-black mt-1">\${metrics.inventory_value.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 p-3 rounded-2xl w-fit mb-4"><Package size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Productos</h3>
              <p className="text-3xl font-black mt-1">{metrics.total_products}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 p-3 rounded-2xl w-fit mb-4"><CreditCard size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Cuentas por Pagar</h3>
              <p className="text-3xl font-black mt-1">\${metrics.total_payables.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 flex flex-col">
               <h3 className="text-lg font-bold flex items-center mb-4"><AlertTriangle size={20} className="text-amber-500 mr-2"/> Próximos a Agotarse</h3>
               <div className="flex-1 space-y-3">
                 {metrics.low_stock.length === 0 ? <p className="text-slate-500">Todo el stock está bien.</p> : metrics.low_stock.map((p:any, i:number) => (
                   <div key={i} className="flex justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                     <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                     <span className="font-bold text-amber-600">Quedan: {p.stock}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 flex flex-col">
               <h3 className="text-lg font-bold flex items-center mb-4"><ArrowUpRight size={20} className="text-emerald-500 mr-2"/> Más Vendidos</h3>
               <div className="flex-1 space-y-3">
                 {metrics.top_sold.length === 0 ? <p className="text-slate-500">No hay ventas registradas.</p> : metrics.top_sold.map((p:any, i:number) => (
                   <div key={i} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                     <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                     <span className="font-bold text-emerald-600">{p.quantity} uds</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 flex flex-col">
               <h3 className="text-lg font-bold flex items-center mb-4"><ArrowDownRight size={20} className="text-rose-500 mr-2"/> Menos Vendidos</h3>
               <div className="flex-1 space-y-3">
                 {metrics.least_sold.length === 0 ? <p className="text-slate-500">No hay ventas registradas.</p> : metrics.least_sold.map((p:any, i:number) => (
                   <div key={i} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                     <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                     <span className="font-bold text-rose-500">{p.quantity} uds</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-blue-500" /> Actividad Reciente</h3>
            <div className="space-y-4">
              {metrics.recent_activity.length === 0 ? <p className="text-slate-500">No hay actividad reciente.</p> : metrics.recent_activity.map((act:any, i:number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{act.type}</p>
                  </div>
                  <div className={\`text-sm font-bold \${act.type === 'Venta' ? 'text-emerald-500' : 'text-rose-500'}\`}>
                    {act.type === 'Venta' ? '+' : '-'}\${act.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Dashboard.tsx', dashboardTsx, 'utf8');
console.log('Dashboard backend and frontend updated!');
