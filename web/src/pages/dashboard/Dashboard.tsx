import { useEffect, useState } from 'react';
import { useBusinessStore } from '../../store/businessStore';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { DollarSign, Package, CreditCard, TrendingUp, Activity, ShoppingBag, AlertTriangle, ArrowUpRight, Clock, Truck } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function Dashboard() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [metrics, setMetrics] = useState<any>({
    total_sales: 0, total_products: 0, inventory_value: 0, total_payables: 0, total_expenses: 0, total_suppliers: 0,
    low_stock: [], top_sold: [], least_sold: [], recent_activity: [], sales_chart: []
  });
  
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

  const StatCard = ({ icon: Icon, title, value, textColor, glowColor }: any) => (
    <div className="floating-card p-6 flex items-center justify-between group overflow-hidden relative">
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 dark:opacity-30 transition-all group-hover:scale-150 ${glowColor}`}></div>
      
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-semibold text-slate-800 dark:text-white tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative z-10 ${textColor}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
              <Activity size={14} className="mr-1.5" /> Sistema En Línea
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Resumen General
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            Métricas principales de <span className="font-bold text-slate-700 dark:text-slate-200">{currentBusiness?.name || 'tu negocio'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/50 pl-11 pr-10 py-2.5 rounded-xl shadow-sm outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="today">Hoy</option>
              <option value="this_week">Esta semana</option>
              <option value="this_month">Este mes</option>
              <option value="this_semester">Este semestre</option>
              <option value="this_year">Este año</option>
              <option value="all_time">Todo el tiempo</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              icon={TrendingUp} title="Ventas Totales" 
              value={`$${metrics.total_sales.toLocaleString()}`}
              textColor="text-indigo-600 dark:text-indigo-400"
              glowColor="bg-indigo-500"
            />
            <StatCard 
              icon={DollarSign} title="Valor Inventario" 
              value={`$${metrics.inventory_value.toLocaleString()}`}
              textColor="text-emerald-600 dark:text-emerald-400"
              glowColor="bg-emerald-500"
            />
            <StatCard 
              icon={Package} title="Total Productos" 
              value={metrics.total_products}
              textColor="text-purple-600 dark:text-purple-400"
              glowColor="bg-purple-500"
            />
            <StatCard 
              icon={CreditCard} title="Cuentas por Pagar" 
              value={`$${metrics.total_payables.toLocaleString()}`}
              textColor="text-rose-600 dark:text-rose-400"
              glowColor="bg-rose-500"
            />
            <StatCard 
              icon={DollarSign} title="Gastos Totales" 
              value={`$${(metrics.total_expenses || 0).toLocaleString()}`}
              textColor="text-amber-600 dark:text-amber-400"
              glowColor="bg-amber-500"
            />
            <StatCard 
              icon={Truck} title="Proveedores" 
              value={metrics.total_suppliers || 0}
              textColor="text-blue-600 dark:text-blue-400"
              glowColor="bg-blue-500"
            />
          </div>

          <div className="floating-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Evolución de Ventas
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.sales_chart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                      return `${localDate.getDate()}/${localDate.getMonth()+1}`;
                    }} 
                    stroke="#94a3b8" fontSize={12} fontWeight={600} tickMargin={12} axisLine={false} tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val.toLocaleString()}`} 
                    stroke="#94a3b8" fontSize={12} fontWeight={600} width={80} axisLine={false} tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
                    labelFormatter={(label: any) => {
                      const date = new Date(label as string);
                      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                      return localDate.toLocaleDateString();
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 600, color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3, className: 'shadow-lg'}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="floating-card p-6 flex flex-col h-full">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <AlertTriangle size={18} className="text-rose-500 mr-2.5" />
                Stock Crítico
              </h3>
              <div className="flex-1 space-y-3">
                {metrics.low_stock.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm py-4 font-medium">Inventario totalmente saludable.</p>
                ) : (
                  metrics.low_stock.map((p: any, i: number) => (
                    <div key={i} className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate pr-2">{p.name}</span>
                      {p.stock === 0 ? (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">Agotado</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">{p.stock} uds</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="floating-card p-6 flex flex-col h-full">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <ArrowUpRight size={18} className="text-emerald-500 mr-2.5" />
                Top Ventas
              </h3>
              <div className="flex-1 space-y-3">
                {metrics.top_sold.length === 0 ? (
                   <p className="text-slate-500 dark:text-slate-400 text-sm py-4 font-medium">Aún no hay datos suficientes.</p>
                ) : metrics.top_sold.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate pr-2">{p.name}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-100/50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">{p.quantity} uds</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="floating-card p-6 flex flex-col h-full">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <ShoppingBag size={18} className="text-indigo-500 mr-2.5" />
                Actividad Reciente
              </h3>
              <div className="flex-1 space-y-3">
                {metrics.recent_activity.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm py-4 font-medium">No hay actividad reciente.</p>
                ) : metrics.recent_activity.map((act: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{act.type}</p>
                    <div className={`text-xs font-semibold px-2.5 py-1 rounded-md ${act.type === 'Venta' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-500/10'}`}>
                      {act.type === 'Venta' ? '+' : '-'}${act.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
