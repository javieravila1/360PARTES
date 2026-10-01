import React, { useEffect, useState } from 'react';
import { useBusinessStore } from '../store/businessStore';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import { DollarSign, Package, CreditCard, TrendingUp, TrendingDown, Users, Activity, BarChart3, ShoppingBag } from 'lucide-react';

export default function Dashboard() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [metrics, setMetrics] = useState({
    total_sales: 0,
    total_products: 0,
    inventory_value: 0,
    total_payables: 0
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

  // Mock data for Tailwind charts
  const weekSales = [120, 210, 180, 290, 240, 350, 310];
  const maxSale = Math.max(...weekSales);

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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-blue-500/10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-3 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                  +12.5%
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Ventas Totales</h3>
              <p className="text-3xl font-black mt-1 tracking-tight">${metrics.total_sales.toLocaleString()}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-emerald-500/10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl">
                  <DollarSign size={24} />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Valor Inventario</h3>
              <p className="text-3xl font-black mt-1 tracking-tight">${metrics.inventory_value.toLocaleString()}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-indigo-500/10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-3 rounded-2xl">
                  <Package size={24} />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Productos</h3>
              <p className="text-3xl font-black mt-1 tracking-tight">{metrics.total_products}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-rose-500/10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                  Atención
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Cuentas por Pagar</h3>
              <p className="text-3xl font-black mt-1 tracking-tight">${metrics.total_payables.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tailwind Chart Section */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500" /> Rendimiento de Ventas (7 días)</h3>
              </div>
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {weekSales.map((val, idx) => {
                  const height = `${(val / maxSale) * 100}%`;
                  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                  return (
                    <div key={idx} className="flex flex-col items-center w-full group cursor-pointer">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">${val}</div>
                      <div className="w-full bg-indigo-100 dark:bg-indigo-500/20 rounded-t-xl relative overflow-hidden group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors" style={{ height: '100%', maxHeight: '200px' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-indigo-500 rounded-t-xl transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                          style={{ height }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 mt-3">{days[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions / Activity */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-emerald-500" /> Actividad Reciente</h3>
              <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <Users size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Cliente Varios</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Venta POS - Hace {i * 15} mins</p>
                    </div>
                    <div className="text-sm font-bold text-emerald-500">+${(i * 120).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                Ver Todo el Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
