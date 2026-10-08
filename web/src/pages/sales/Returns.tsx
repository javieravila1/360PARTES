import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Search, Undo2, ChevronDown, ChevronUp } from 'lucide-react';
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

  const handleReturn = async (sale: any) => {
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([id, qty]) => qty > 0 && sale.details.some((d: any) => d.id === id))
      .map(([id, qty]) => ({ sale_detail_id: id, quantity: qty }));

    if (itemsToReturn.length === 0) {
      toast.warning('Ingresa al menos 1 cantidad a devolver');
      return;
    }

    try {
      await apiClient.post(`/sales/${sale.id}/return`, {
        items: itemsToReturn,
        notes: notes
      });
      toast.success('Devolución procesada con éxito');
      setExpandedSale(null);
      setReturnQuantities({});
      setNotes('');
      fetchSales();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error al procesar devolución');
    }
  };

  const filteredSales = sales.filter(sale => {
    const invoiceId = sale.invoice_number || sale.id.substring(0, 8).toUpperCase();
    return invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
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
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por ID de venta..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                          onClick={() => handleReturn(sale)}
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
    </div>
  );
}
