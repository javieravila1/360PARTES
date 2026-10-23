import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Search, Undo2, ChevronDown, ChevronUp, AlertTriangle, Calendar, CheckCircle2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { ExcelActions } from '../../components/ExcelActions';

export default function Returns() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros de fecha
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal de confirmación de devolución
  const [saleToReturn, setSaleToReturn] = useState<any | null>(null);
  const [confirmItems, setConfirmItems] = useState<{ id: string; name: string; quantity: number; unit_price: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/sales/');
      // Sort to show recent first
      setSales(data.sort((a: any, b: any) => new Date(b.sale_date || b.created_at).getTime() - new Date(a.sale_date || a.created_at).getTime()));
    } catch (e) {
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) fetchSales();
  }, [currentBusiness]);

  const onInitiateReturn = (sale: any) => {
    const items = sale.details
      .filter((d: any) => (returnQuantities[d.id] || 0) > 0)
      .map((d: any) => ({
        id: d.id,
        name: d.product_name,
        quantity: returnQuantities[d.id],
        unit_price: d.unit_price
      }));

    if (items.length === 0) {
      toast.warning('Ingresa al menos 1 cantidad a devolver');
      return;
    }

    setConfirmItems(items);
    setSaleToReturn(sale);
  };

  const executeReturn = async () => {
    if (!saleToReturn || confirmItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(`/sales/${saleToReturn.id}/return`, {
        items: confirmItems.map(item => ({ sale_detail_id: item.id, quantity: item.quantity })),
        notes: notes
      });
      toast.success('Devolución procesada con éxito');
      setSaleToReturn(null);
      setConfirmItems([]);
      setExpandedSale(null);
      setReturnQuantities({});
      setNotes('');
      fetchSales();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error al procesar devolución');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseLocal = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.length === 10) return new Date(dateStr + 'T00:00:00');
    return new Date(dateStr);
  };

  const filteredSales = sales.filter(sale => {
    const invoiceId = sale.invoice_number || sale.id.substring(0, 8).toUpperCase();
    const matchesSearch = invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const saleDateObj = parseLocal(sale.sale_date || sale.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'custom') {
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (saleDateObj < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (saleDateObj > end) return false;
      }
      return true;
    }

    if (dateFilter === 'today') {
      return saleDateObj >= today;
    }
    if (dateFilter === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return saleDateObj >= yest && saleDateObj < today;
    }
    if (dateFilter === 'this_week') {
      const startWeek = new Date(today);
      startWeek.setDate(startWeek.getDate() - startWeek.getDay());
      return saleDateObj >= startWeek;
    }
    if (dateFilter === 'this_month') {
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return saleDateObj >= startMonth;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Devoluciones</h1>
          <p className="text-slate-500 mt-2">Selecciona la venta y los repuestos a devolver al inventario</p>
        </div>
        <div className="flex gap-2 items-center">
          <ExcelActions data={sales} filename="Devoluciones" />
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-3 rounded-xl border border-orange-200 dark:border-orange-800/50 flex items-center gap-3 shadow-sm">
              <Undo2 size={24} />
              <div className="text-sm font-medium">Reversa ventas y restaura stock</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por ID de venta o factura..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-shadow dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Calendar size={14} className="text-orange-500" />
              <span>Fecha:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent outline-none font-bold text-slate-700 dark:text-white cursor-pointer ml-1"
              >
                <option value="all">Todas</option>
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="this_week">Esta semana</option>
                <option value="this_month">Este mes</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs outline-none dark:text-white font-medium"
                  title="Fecha inicio"
                />
                <span className="text-slate-400 text-xs">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs outline-none dark:text-white font-medium"
                  title="Fecha fin"
                />
              </div>
            )}

            {(dateFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => { setDateFilter('all'); setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                className="px-2.5 py-1.5 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg font-bold transition"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando ventas...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay ventas que coincidan con la búsqueda</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                      Venta #{sale.invoice_number || sale.id.substring(0, 8).toUpperCase()}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(sale.sale_date || sale.created_at).toLocaleString()} • <span className={`font-semibold ${sale.payment_status === 'REFUNDED' ? 'text-red-500' : 'text-indigo-500'}`}>{sale.payment_status === 'REFUNDED' ? 'REEMBOLSADA' : sale.payment_method}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-xl">${sale.total.toLocaleString()}</div>
                    <div className="text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded-full">
                      {expandedSale === sale.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {expandedSale === sale.id && (
                  <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold mb-4 text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">Productos de la factura</h4>
                    <div className="space-y-3">
                      {sale.details.map((item: any, i: number) => (
                        <div key={item.id || i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.product_name}</p>
                            <p className="text-sm text-slate-500">Comprados: {item.quantity} | Precio c/u: ${item.unit_price}</p>
                          </div>
                          
                          {item.quantity > 0 ? (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-slate-500">Cant. a devolver:</span>
                              <input 
                                type="number" 
                                min="0" 
                                max={item.quantity}
                                value={returnQuantities[item.id] || ''}
                                onChange={(e) => setReturnQuantities({...returnQuantities, [item.id]: Number(e.target.value)})}
                                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="0"
                              />
                            </div>
                          ) : (
                            <span className="text-red-500 font-bold text-sm bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">Devuelto</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {sale.details.some((d: any) => d.quantity > 0) && (
                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motivo de Devolución (Opcional)</label>
                        <input 
                          type="text" 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none mb-4"
                          placeholder="Ej: Producto dañado, cliente cambió de opinión..."
                        />
                        <button 
                          onClick={() => onInitiateReturn(sale)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                          <Undo2 size={20} />
                          Procesar Devolución Seleccionada
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirmación de Devolución */}
      {saleToReturn && confirmItems.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg transition-colors">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Confirmar Devolución</h2>
                  <p className="text-xs text-slate-500">Esta acción restaurará el stock de los productos seleccionados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSaleToReturn(null); setConfirmItems([]); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-5 space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Factura / Venta:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  #{saleToReturn.invoice_number || saleToReturn.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total a Reembolsar:</span>
                <span className="font-black text-rose-500 text-lg">
                  ${confirmItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0).toLocaleString()}
                </span>
              </div>
              {notes && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Motivo:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 italic max-w-[200px] truncate">{notes}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Repuestos a devolver ({confirmItems.reduce((a, b) => a + b.quantity, 0)} unidades)
              </p>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                {confirmItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-xl text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-slate-500">{item.quantity} un. x ${Number(item.unit_price).toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-rose-500">${(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setSaleToReturn(null); setConfirmItems([]); }}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeReturn}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Procesando...</>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirmar Devolución
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
