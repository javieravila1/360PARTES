
import { useEffect, useState } from 'react';
import { useBusinessStore } from '../store/businessStore';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, CreditCard, TrendingUp, Activity, ShoppingBag, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [metrics, setMetrics] = useState<any>({
    total_sales: 0, total_products: 0, inventory_value: 0, total_payables: 0,
    low_stock: [], top_sold: [], least_sold: [], recent_activity: []
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState('today');



  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/dashboard/?time_filter=${timeFilter}`);
        setMetrics(data);
      } catch (error) {
        toast.error('Error al cargar métricas del dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (currentBusiness) fetchMetrics();
  }, [currentBusiness, timeFilter]);

  return (
    <div className="font-sans text-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-1">Bienvenido,</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm pb-1">
            {currentBusiness?.name || 'Cargando...'}
          </h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
            Consulta el estado de tu negocio y sus principales indicadores.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-white dark:bg-[#1E293B] px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="today">Este día</option>
            <option value="this_week">Esta semana</option>
            <option value="this_month">Este mes</option>
            <option value="this_semester">Este semestre</option>
            <option value="this_year">Este año</option>
            <option value="all_time">Todo el tiempo</option>
          </select>
          <div className="bg-white dark:bg-[#1E293B] px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            <span className="text-sm font-bold">Sistema En Línea</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 p-3 rounded-lg w-fit mb-4"><TrendingUp size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Ventas Totales</h3>
              <p className="text-2xl font-semibold mt-1">${metrics.total_sales.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 p-3 rounded-lg w-fit mb-4"><DollarSign size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Valor Inventario</h3>
              <p className="text-2xl font-semibold mt-1">${metrics.inventory_value.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 p-3 rounded-lg w-fit mb-4"><Package size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Productos</h3>
              <p className="text-2xl font-semibold mt-1">{metrics.total_products}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 p-3 rounded-lg w-fit mb-4"><CreditCard size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Cuentas por Pagar</h3>
              <p className="text-2xl font-semibold mt-1">${metrics.total_payables.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 p-3 rounded-lg w-fit mb-4"><DollarSign size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Gastos Totales</h3>
              <p className="text-2xl font-semibold mt-1">${(metrics.total_expenses || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 relative overflow-hidden group">
              <div className="bg-teal-100 dark:bg-teal-500/20 text-teal-600 p-3 rounded-lg w-fit mb-4"><Package size={24} /></div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Total Proveedores</h3>
              <p className="text-2xl font-semibold mt-1">{metrics.total_suppliers || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500" /> Ventas de los últimos 30 días</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.sales_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      // Ajustar a la zona horaria local para que no cambie el día
                      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                      return `${localDate.getDate()}/${localDate.getMonth()+1}`;
                    }} 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val.toLocaleString()}`} 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
                    labelFormatter={(label: any) => {
                      const date = new Date(label as string);
                      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                      return localDate.toLocaleDateString();
                    }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 flex flex-col h-full">
              <h3 className="text-lg font-bold flex items-center mb-6"><AlertTriangle size={20} className="text-rose-500 mr-2" /> Próximos a Agotarse</h3>
              <div className="flex-1 space-y-4">
                {metrics.low_stock.length === 0 ? (
                  <p className="text-slate-500">Todo el stock está bien.</p>
                ) : (
                  metrics.low_stock.map((p: any, i: number) => (
                    <div key={i} className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle size={14} /> Stock crítico
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-base leading-tight">{p.name}</span>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Stock: {p.stock} unidades</span>
                        {p.stock === 0 ? (
                          <span className="text-xs font-black text-white bg-rose-500 px-2 py-1 rounded uppercase flex items-center gap-1">🔴 AGOTADO</span>
                        ) : (
                          <span className="text-xs font-black text-amber-700 bg-amber-200 px-2 py-1 rounded uppercase flex items-center gap-1">⚠ BAJO STOCK</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => navigate('/products')}
                className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                Ver inventario &rarr;
              </button>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 flex flex-col">
              <h3 className="text-lg font-bold flex items-center mb-4"><ArrowUpRight size={20} className="text-emerald-500 mr-2" /> Más Vendidos</h3>
              <div className="flex-1 space-y-3">
                {metrics.top_sold.length === 0 ? <p className="text-slate-500">No hay ventas registradas.</p> : metrics.top_sold.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="font-bold text-emerald-600">{p.quantity} uds</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700 flex flex-col">
              <h3 className="text-lg font-bold flex items-center mb-4"><ArrowDownRight size={20} className="text-rose-500 mr-2" /> Menos Vendidos</h3>
              <div className="flex-1 space-y-3">
                {metrics.least_sold.length === 0 ? <p className="text-slate-500">No hay ventas registradas.</p> : metrics.least_sold.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="font-bold text-rose-500">{p.quantity} uds</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-sm border dark:border-slate-700">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-blue-500" /> Actividad Reciente</h3>
            <div className="space-y-4">
              {metrics.recent_activity.length === 0 ? <p className="text-slate-500">No hay actividad reciente.</p> : metrics.recent_activity.map((act: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#F8FAFC] dark:bg-slate-700/50">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{act.type}</p>
                  </div>
                  <div className={`text-sm font-bold ${act.type === 'Venta' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {act.type === 'Venta' ? '+' : '-'}${act.amount}
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
