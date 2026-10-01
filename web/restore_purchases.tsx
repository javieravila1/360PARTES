import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Search, Plus, Minus, Trash2, PackagePlus, Truck, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
}

interface Supplier {
  id: string;
  company_name: string;
}

interface PurchaseItem extends Product {
  quantity: number;
  unit_cost: number;
}

export default function Purchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, supRes] = await Promise.all([
          apiClient.get('/products/'),
          apiClient.get('/contacts/suppliers')
        ]);
        setProducts(prodRes.data);
        setSuppliers(supRes.data);
      } catch (error) {
        toast.error('Error al cargar datos iniciales');
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 5); // Limit search results visually

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, unit_cost: product.cost_price || 0 }];
    });
    setSearch('');
  };

  const updateItem = (id: string, field: 'quantity' | 'unit_cost', value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value > 0 ? value : 0 };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.unit_cost * item.quantity), 0);
  const total = subtotal;

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.warning('Agregue productos a la compra');
      return;
    }
    if (paymentStatus !== 'PAID' && !selectedSupplier) {
      toast.warning('Debe seleccionar un proveedor para compras a crédito');
      return;
    }
    if (paymentStatus !== 'PAID' && !dueDate) {
      toast.warning('Seleccione la fecha de vencimiento del crédito');
      return;
    }

    setIsSubmitting(true);
    
    const purchaseData = {
      supplier_id: selectedSupplier || null,
      invoice_number: invoiceNumber,
      purchase_date: new Date().toISOString().split('T')[0],
      due_date: paymentStatus !== 'PAID' ? dueDate : null,
      subtotal,
      total,
      payment_method: 'TRANSFER', // Default
      payment_status: paymentStatus,
      amount_paid: paymentStatus === 'PAID' ? total : (paymentStatus === 'PARTIAL' ? amountPaid : 0),
      details: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        discount: 0
      }))
    };

    try {
      await apiClient.post('/purchases/', purchaseData);
      toast.success('Compra registrada e inventario actualizado');
      
      // Reset form
      setItems([]);
      setSelectedSupplier('');
      setPaymentStatus('PAID');
      setDueDate('');
      setInvoiceNumber('');
      setAmountPaid(0);
      
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al registrar la compra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row h-full gap-6">
      
      {/* Columna Izquierda: Formulario de Compra e Ingreso de Ítems */}
      <div className="flex-[2] flex flex-col gap-6">
        
        {/* Cabecera Factura */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><PackagePlus className="mr-2 text-blue-600" /> Registrar Ingreso de Mercancía</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 text-slate-400" size={16} />
                <select 
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="pl-9 block w-full rounded-lg border-slate-300 border p-2 text-sm"
                >
                  <option value="">Seleccione Proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Factura Nro.</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="block w-full rounded-lg border-slate-300 border p-2 text-sm" placeholder="Ej. F-10293" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
              <select 
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  if (e.target.value === 'PAID') setAmountPaid(total);
                  else if (e.target.value === 'PENDING') setAmountPaid(0);
                }}
                className="block w-full rounded-lg border-slate-300 border p-2 text-sm"
              >
                <option value="PAID">Pagado (Contado)</option>
                <option value="PENDING">Crédito (A deber total)</option>
                <option value="PARTIAL">Abono Inicial (Parcial)</option>
              </select>
            </div>
            {paymentStatus !== 'PAID' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-rose-600">Vencimiento Crédito</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-rose-400" size={16} />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="pl-9 block w-full rounded-lg border-rose-300 border p-2 text-sm focus:ring-rose-500 focus:border-rose-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Búsqueda y Lista de Ítems */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar producto para agregar a la compra..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addItem(p)} className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 flex justify-between">
                    <div><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-500">{p.sku}</p></div>
                    <div className="text-right text-sm text-blue-600 font-bold">Costo act: ${p.cost_price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Producto</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-32">Cantidad</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-40">Costo Unitario ($)</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-32 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Busca y selecciona productos arriba</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full border rounded p-1 text-center" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(item.id, 'unit_cost', Number(e.target.value))} className="w-full border rounded p-1 text-right" />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                      ${(item.quantity * item.unit_cost).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Totales y Confirmación */}
      <div className="flex-1 max-w-sm flex flex-col bg-slate-900 rounded-2xl shadow-sm overflow-hidden text-white">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold flex items-center">Resumen de Compra</h2>
        </div>
        
        <div className="p-6 space-y-4 flex-1">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Impuestos (0%)</span>
            <span>$0</span>
          </div>
          <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
            <span className="text-lg">TOTAL</span>
            <span className="text-3xl font-bold text-blue-400">${total.toLocaleString()}</span>
          </div>

          {paymentStatus === 'PARTIAL' && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">Abono Inicial (Contado)</label>
              <input type="number" max={total} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white text-lg focus:ring-blue-500 focus:border-blue-500" />
              <div className="flex justify-between mt-2 text-rose-400 text-sm font-bold">
                <span>Deuda a crear:</span>
                <span>${(total - amountPaid).toLocaleString()}</span>
              </div>
            </div>
          )}
          {paymentStatus === 'PENDING' && (
            <div className="mt-6 pt-6 border-t border-slate-800">
               <div className="bg-rose-900/30 border border-rose-500/50 p-4 rounded-xl text-rose-300 text-sm">
                  Esta compra sumará <b>${total.toLocaleString()}</b> a tu saldo de Cuentas por Pagar.
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-800">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'CONFIRMAR COMPRA E INGRESAR STOCK'}
          </button>
        </div>
      </div>
      
    </div>
  );
}
