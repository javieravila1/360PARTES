import { useEffect, useState } from 'react';
import { useBusinessStore } from '../../store/businessStore';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { DollarSign, Package, CreditCard, TrendingUp, Activity, ShoppingBag, AlertTriangle, ArrowUpRight, Clock, Truck, Boxes, Store, Calendar, X, Coins, Sparkles } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function Dashboard() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness);
  const [metrics, setMetrics] = useState<any>({
    total_sales: 0, total_products: 0, inventory_cost: 0, inventory_value: 0, potential_profit: 0, total_payables: 0, total_expenses: 0, total_suppliers: 0,
    businesses_inventory: [], low_stock: [], top_sold: [], least_sold: [], recent_activity: [], sales_chart: []
  });
  
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');
  const [chartTimeFilter, setChartTimeFilter] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        let params = `time_filter=${timeFilter}&chart_time_filter=${chartTimeFilter}`;
        if (startDate) params += `&start_date=${startDate}`;
        if (endDate) params += `&end_date=${endDate}`;
        const { data } = await apiClient.get(`/dashboard/?${params}`);
        setMetrics(data);
      } catch (error) {
        toast.error('Error al cargar métricas del dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (currentBusiness) fetchMetrics();

    const handler = () => { if (currentBusiness) fetchMetrics(); };
    window.addEventListener('db_updated', handler);
    return () => window.removeEventListener('db_updated', handler);
  }, [currentBusiness, timeFilter, chartTimeFilter, startDate, endDate]);

  const totalAllBusinessesCost = (metrics.businesses_inventory || []).reduce(
    (acc: number, b: any) => acc + (Number(b.inventory_cost) || 0),
    0
  );

  const totalAllBusinessesRetail = (metrics.businesses_inventory || []).reduce(
    (acc: number, b: any) => acc + (Number(b.inventory_value) || 0),
    0
  );

  const handleSwitchBusiness = (biz: any) => {
    setCurrentBusiness({
      id: biz.business_id,
      name: biz.business_name,
      currency: '$'
    });
    toast.info(`Cambiado a ${biz.business_name}`);
  };

  const StatCard = ({ icon: Icon, title, value, textColor, glowColor, subtitle, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`floating-card p-6 flex items-center justify-between group overflow-hidden relative transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg' : ''
      }`}
    >
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 dark:opacity-30 transition-all group-hover:scale-150 ${glowColor}`}></div>
      
      <div className="z-10 min-w-0 pr-2">
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 truncate">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight truncate">{value}</p>
        {subtitle && (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
      <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative z-10 flex-shrink-0 ${textColor}`}>
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
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">
            {currentBusiness?.name || 'Tu Negocio'}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Resumen General y Métricas Principales
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Rango de Fechas (Desde - Hasta) */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/50 p-1.5 px-3 rounded-2xl shadow-sm">
            <Calendar size={15} className="text-indigo-500 mr-1 flex-shrink-0" />
            
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Desde</span>
              <input
                id="dashboard-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-0 p-1 dark:[color-scheme:dark]"
              />
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-bold px-0.5">-</span>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hasta</span>
              <input
                id="dashboard-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-0 p-1 dark:[color-scheme:dark]"
              />
            </div>

            {(startDate || endDate) && (
              <button
                id="dashboard-date-clear"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                title="Limpiar rango de fechas"
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selector de periodo rápido */}
          <div className="relative">
            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              disabled={!!(startDate || endDate)}
              className="disabled:opacity-40 appearance-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/50 pl-11 pr-10 py-2.5 rounded-2xl shadow-sm outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:ring-2 focus:ring-indigo-500/20"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={TrendingUp} title="Ventas Totales" 
              value={`$${metrics.total_sales.toLocaleString()}`}
              textColor="text-indigo-600 dark:text-indigo-400"
              glowColor="bg-indigo-500"
            />
            <StatCard 
              icon={DollarSign} title="Ganancia" 
              value={`$${(metrics.total_profit || 0).toLocaleString()}`}
              textColor="text-emerald-600 dark:text-emerald-400"
              glowColor="bg-emerald-500"
            />
            <StatCard 
              icon={Boxes} title="Costo Total Inventario" 
              value={`$${(metrics.inventory_cost ?? 0).toLocaleString()}`}
              textColor="text-teal-600 dark:text-teal-400"
              glowColor="bg-teal-500"
              subtitle="Inversión en stock actual disponible"
              onClick={() => {
                const el = document.getElementById('inventory-by-business-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <StatCard 
              icon={Coins} title="Valor Total Inventario" 
              value={`$${(metrics.inventory_value || 0).toLocaleString()}`}
              textColor="text-cyan-600 dark:text-cyan-400"
              glowColor="bg-cyan-500"
              subtitle={`Valor comercial (Margen: +$${(metrics.potential_profit || 0).toLocaleString()})`}
              onClick={() => {
                const el = document.getElementById('inventory-by-business-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
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

          {/* Card: Costo Total y Valor del Inventario para Cada Negocio */}
          <div id="inventory-by-business-section" className="floating-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm">
                  <Store size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Costo y Valor Total del Inventario por Negocio
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Inversión a precio de costo vs valor comercial del stock actual disponible en cada sede
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {totalAllBusinessesCost >= 0 && (
                  <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2 rounded-xl">
                    <Boxes size={16} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <div className="text-right">
                      <span className="text-[10px] block font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Costo Global Stock
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        ${totalAllBusinessesCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {totalAllBusinessesRetail > 0 && (
                  <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2 rounded-xl">
                    <Coins size={16} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <div className="text-right">
                      <span className="text-[10px] block font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Valor Venta Global
                      </span>
                      <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                        ${totalAllBusinessesRetail.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(metrics.businesses_inventory && metrics.businesses_inventory.length > 0) ? (
                metrics.businesses_inventory.map((biz: any) => {
                  const isCurrent = biz.business_id === currentBusiness?.id;
                  const pct = totalAllBusinessesCost > 0 
                    ? Math.round((Number(biz.inventory_cost || 0) / totalAllBusinessesCost) * 100) 
                    : 0;

                  return (
                    <div 
                      key={biz.business_id}
                      className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                        isCurrent 
                          ? 'bg-gradient-to-br from-teal-500/[0.05] to-cyan-500/[0.03] dark:from-teal-500/[0.1] dark:to-cyan-500/[0.05] border-teal-500/40 dark:border-teal-500/30 ring-1 ring-teal-500/20 shadow-sm' 
                          : 'bg-white/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-teal-500 ring-4 ring-teal-500/20 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                          <h4 className="font-semibold text-slate-800 dark:text-white text-base truncate" title={biz.business_name}>
                            {biz.business_name}
                          </h4>
                        </div>
                        {isCurrent ? (
                          <span className="flex-shrink-0 text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Actual
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchBusiness(biz)}
                            className="flex-shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800/40 cursor-pointer"
                          >
                            Ver negocio <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>

                      {/* Espacio entre las cards de costo y valor comercial con diseño profesional y tipografía equilibrada */}
                      <div className="grid grid-cols-2 gap-3.5 my-3.5">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Costo Stock
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
                              costo×stock
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                            ${Number(biz.inventory_cost || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-100/80 dark:border-cyan-900/40 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-700/80 dark:text-cyan-300/80">
                              Valor Venta
                            </span>
                            <span className="text-[9px] text-cyan-600/70 dark:text-cyan-400/70">
                              pvp×stock
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-cyan-700 dark:text-cyan-300 tracking-tight">
                            ${Number(biz.inventory_value || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {biz.potential_profit > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 text-xs mb-3">
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                            <Sparkles size={12} className="text-emerald-500" /> Margen proyectado:
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                            +${Number(biz.potential_profit).toLocaleString()} {biz.inventory_value > 0 ? `(${Math.round((biz.potential_profit / biz.inventory_value) * 100)}%)` : ''}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Package size={13} className="text-slate-400" />
                            {biz.total_products || 0} ref. {biz.total_stock !== undefined ? `· ${biz.total_stock} und.` : ''} en stock
                          </span>
                          <span className="text-teal-600 dark:text-teal-400 font-medium">{pct}% del total</span>
                        </div>

                        <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isCurrent ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-slate-400 dark:bg-slate-500'}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-5 rounded-2xl border bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 col-span-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{currentBusiness?.name || 'Negocio Actual'}</span>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                        Costo: ${(metrics.inventory_cost ?? 0).toLocaleString()} | Valor Venta: ${(metrics.inventory_value || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{metrics.total_products || 0} productos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="floating-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Evolución de Ventas y Ganancias
              </h3>
              <select
                value={chartTimeFilter}
                onChange={(e) => setChartTimeFilter(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <option value="today">Hoy</option>
                <option value="this_week">Esta semana</option>
                <option value="this_month">Este mes</option>
                <option value="this_semester">Este semestre</option>
                <option value="this_year">Este año</option>
                <option value="all_time">Todo el tiempo</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.sales_chart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, name === 'profit' ? 'Ganancias' : 'Ventas']}
                    labelFormatter={(label: any) => {
                      const date = new Date(label as string);
                      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                      return localDate.toLocaleDateString();
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 600, color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3, className: 'shadow-lg'}} />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" activeDot={{r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="floating-card p-6 flex flex-col h-full">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <AlertTriangle size={18} className="text-rose-500 mr-2.5" />
                Stock Crítico
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
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
                <Clock size={18} className="text-rose-500 mr-2.5" />
                Créditos por Vencer
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
                {(!metrics.payable_alerts || metrics.payable_alerts.length === 0) ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm py-4 font-medium">No hay créditos próximos a vencer.</p>
                ) : (
                  metrics.payable_alerts.map((p: any, i: number) => (
                    <div key={i} className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{p.supplier_name}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${p.is_overdue ? 'text-rose-600' : 'text-amber-700'}`}>
                          {p.is_overdue ? 'VENCIDO' : `Vence: ${p.due_date}`}
                        </span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">${p.balance.toLocaleString()}</span>
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
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
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
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
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
