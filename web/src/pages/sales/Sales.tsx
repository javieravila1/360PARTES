
import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, User, Calendar, History, Receipt, Printer } from 'lucide-react';
import { useBusinessStore } from '../../store/businessStore';
import { toast } from 'react-toastify';
import { ExcelActions } from '../../components/ExcelActions';

interface ProductBatch {
  id: string;
  current_stock: number;
  cost_price: number;
  selling_price: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  brand_id?: string;
  category_id?: string;
  batches?: ProductBatch[];
}

interface CartItem extends Product {
  cart_quantity: number;
  cart_key: string;
  batch_id?: string;
}

export default function Sales() {
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>('POS');
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);

  // POS States
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterBrandId, setFilterBrandId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [batchModalProduct, setBatchModalProduct] = useState<Product | null>(null);

  // History States
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      fetchData();
    }
    const handler = () => { if (currentBusiness) fetchData(); };
    window.addEventListener('db_updated', handler);
    return () => window.removeEventListener('db_updated', handler);
  }, [currentBusiness]);

  useEffect(() => {
    if (activeTab === 'HISTORY' && currentBusiness) {
      fetchHistory();
    }
    const handler = () => { if (activeTab === 'HISTORY' && currentBusiness) fetchHistory(); };
    window.addEventListener('db_updated', handler);
    return () => window.removeEventListener('db_updated', handler);
  }, [activeTab, currentBusiness]);

  const fetchData = async () => {
    try {
      const [prodRes, custRes, brandRes, catRes] = await Promise.all([
        apiClient.get('/products/'),
        apiClient.get('/contacts/customers'),
        apiClient.get('/brands/'),
        apiClient.get('/categories/')
      ]);
      setProducts(prodRes.data.map((p: any) => ({
        ...p,
        selling_price: Number(p.sale_price || p.selling_price || 0),
        current_stock: Number(p.current_stock || 0),
      })));
      setCustomers(custRes.data);
      setBrands(brandRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await apiClient.get('/sales/');
      setSalesHistory(data);
    } catch (e) {
      toast.error('Error al cargar historial de ventas');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesBrand = filterBrandId ? p.brand_id === filterBrandId : true;
    const matchesCategory = filterCategoryId ? p.category_id === filterCategoryId : true;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const updatePrice = (cart_key: string, newPrice: number) => {
    setCart(prev => prev.map(item => item.cart_key === cart_key ? { ...item, selling_price: newPrice } : item));
  };

  const addToCart = (product: Product, selectedBatch?: ProductBatch) => {
    const availableBatches = (product.batches || []).filter(b => b.current_stock > 0);
    
    if (!selectedBatch && availableBatches.length === 1) {
      selectedBatch = availableBatches[0];
    } else if (!selectedBatch && availableBatches.length > 1) {
      setBatchModalProduct(product);
      return;
    }

    const currentStock = selectedBatch ? selectedBatch.current_stock : product.current_stock;
    const sellingPrice = selectedBatch ? selectedBatch.selling_price : product.selling_price;
    const batchId = selectedBatch ? selectedBatch.id : undefined;
    const cartKey = batchId ? `${product.id}-${batchId}` : product.id;

    if (currentStock <= 0) {
      toast.warning('Producto o lote agotado');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.cart_key === cartKey);
      if (existing) {
        if (existing.cart_quantity >= currentStock) {
          toast.warning('Stock máximo alcanzado para este lote');
          return prev;
        }
        return prev.map(item => item.cart_key === cartKey ? { ...item, cart_quantity: item.cart_quantity + 1 } : item);
      }
      return [...prev, { ...product, cart_quantity: 1, selling_price: sellingPrice, current_stock: currentStock, batch_id: batchId, cart_key: cartKey }];
    });
    setBatchModalProduct(null);
  };

  const updateQuantity = (cart_key: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cart_key === cart_key) {
        const newQ = item.cart_quantity + delta;
        if (newQ > item.current_stock) {
          toast.warning('No hay más stock disponible');
          return item;
        }
        return newQ > 0 ? { ...item, cart_quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cart_key: string) => {
    setCart(prev => prev.filter(item => item.cart_key !== cart_key));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.cart_quantity), 0);
  const total = subtotal;

  const printReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const saleDateStr = sale.sale_date || sale.created_at || new Date().toISOString();
    const date = new Date(saleDateStr).toLocaleString();
    const bName = currentBusiness?.name || 'Mi Negocio';
    const bId = currentBusiness?.id?.substring(0, 8) || '';
    
    let itemsHtml = '';
    sale.details?.forEach((d: any) => {
      itemsHtml += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
          <span>${d.quantity}x ${d.product_name || 'Producto'}</span>
          <span>$${(d.quantity * d.unit_price).toLocaleString()}</span>
        </div>
      `;
    });

    // Try to find customer name from customers list if we just created it, else it should come from API if modified
    let customerName = sale.customer_name || 'Consumidor Final';

    const html = `
      <html>
        <head>
          <title>Recibo ${sale.id?.substring(0,8) || 'Venta'}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 20px; }
            .border-b { border-bottom: 1px dashed #000; margin-bottom: 10px; padding-bottom: 10px; }
            .flex-between { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center border-b">
            <div class="font-bold text-xl">${bName}</div>
            <div style="font-size: 12px; margin-top: 5px;">ID: ${bId}</div>
            <div style="font-size: 12px;">Fecha: ${date}</div>
          </div>
          
          <div class="border-b" style="font-size: 12px;">
            <div>Cliente: ${customerName}</div>
            <div>Método: ${sale.payment_method || 'EFECTIVO'}</div>
            <div>Ticket: #${sale.id?.substring(0,8).toUpperCase() || 'N/A'}</div>
          </div>

          <div class="border-b">
            <div class="font-bold flex-between" style="font-size: 12px; margin-bottom: 5px;">
              <span>CANT DESCRIPCIÓN</span>
              <span>TOTAL</span>
            </div>
            ${itemsHtml}
          </div>

          <div class="flex-between font-bold" style="font-size: 16px;">
            <span>TOTAL:</span>
            <span>$${Number(sale.total).toLocaleString()}</span>
          </div>
          
          <div class="text-center mt-2" style="font-size: 12px; margin-top: 20px;">
            ¡Gracias por su preferencia!
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const saleData = {
      customer_id: selectedCustomerId || null,
      sale_date: saleDate,
      subtotal,
      total,
      payment_method: paymentMethod,
      payment_status: 'PAID',
      details: cart.map(item => ({
        product_id: item.id,
        batch_id: item.batch_id || null,
        quantity: item.cart_quantity,
        unit_price: item.selling_price,
        discount: 0
      }))
    };

    try {
      const { data: newSale } = await apiClient.post('/sales/', saleData);
      toast.success('Venta registrada con éxito');
      setCart([]);
      setSelectedCustomerId('');
      fetchData();
    } catch (error) {
      toast.error('Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-800 dark:text-slate-100">
      <div className="flex mb-6 bg-white dark:bg-slate-800 p-1.5 rounded-2xl w-fit shadow-sm border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('POS')}
          className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'POS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <ShoppingCart size={18} className="mr-2" /> Punto de Venta
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <History size={18} className="mr-2" /> Historial de Ventas
        </button>
      </div>

      {activeTab === 'POS' ? (
        <div className="flex flex-col md:flex-row h-full gap-6">
          {/* Catálogo y Búsqueda */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU o escanear código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <select value={filterBrandId} onChange={e => setFilterBrandId(e.target.value)} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none">
                  <option value="">Todas las marcas</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none">
                  <option value="">Todas las categorías</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(p => {
                  let cardClasses = 'bg-emerald-500 hover:bg-emerald-600 text-white';
                  let textSecondary = 'text-emerald-100';

                  if (p.current_stock === 0) {
                    cardClasses = 'bg-rose-500 hover:bg-rose-600 text-white';
                    textSecondary = 'text-rose-100';
                  } else if (p.current_stock <= 5) {
                    cardClasses = 'bg-amber-500 hover:bg-amber-600 text-white';
                    textSecondary = 'text-amber-100';
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`rounded-xl p-4 cursor-pointer hover:shadow-lg transition flex flex-col justify-between ${cardClasses}`}
                    >
                      <div>
                        <p className={`text-xs mb-1 ${textSecondary}`}>{p.sku || 'Sin código'}</p>
                        <h3 className="font-semibold text-white leading-tight">{p.name}</h3>
                      </div>
                      <div className="mt-4 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className={`text-[10px] uppercase font-bold ${textSecondary}`}>Precio Sugerido</span>
                          <span className="font-black text-white">${p.selling_price.toLocaleString()}</span>
                        </div>
                        <span className="text-xs font-bold text-white">
                          Stock: {p.current_stock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carrito POS */}
          <div className="w-full md:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center"><ShoppingCart className="mr-2" size={20} /> Resumen de Venta</h2>
              <span className="bg-slate-700 px-2 py-1 rounded-lg text-xs">{cart.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cart_key} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">
                        {item.name} {item.batch_id && <span className="text-xs font-normal text-indigo-500 ml-1">(Lote: {item.batch_id.substring(0,6)})</span>}
                      </h4>
                      <div className="flex items-center mt-1 gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Precio Venta:</span>
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.selling_price === 0 ? '' : item.selling_price.toLocaleString('es-CO')}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            let num = Number(val);
                            if (num > 1000000000) num = 1000000000;
                            updatePrice(item.cart_key, num);
                          }}
                          onBlur={() => {
                            if (item.selling_price > 0 && item.selling_price < 100) {
                              updatePrice(item.cart_key, 100);
                            }
                          }}
                          className="w-28 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-0.5 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none text-right"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-600 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.cart_key, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-500 rounded text-slate-600 dark:text-slate-300"><Minus size={16} /></button>
                        <span className="w-8 text-center font-semibold text-sm">{item.cart_quantity}</span>
                        <button onClick={() => updateQuantity(item.cart_key, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-500 rounded text-slate-600 dark:text-slate-300"><Plus size={16} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.cart_key)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Area */}
            <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1"><User size={14} className="mr-1" /> Cliente</label>
                  <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none">
                    <option value="">Consumidor Final</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1"><Calendar size={14} className="mr-1" /> Fecha Venta</label>
                  <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="flex justify-between font-bold text-2xl text-slate-800 dark:text-white mb-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'EFECTIVO' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Banknote size={20} className="mb-1" /> Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('TRANSFERENCIA')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'TRANSFERENCIA' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Landmark size={20} className="mb-1" /> Transf.
                </button>
                <button
                  onClick={() => setPaymentMethod('TARJETA')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'TARJETA' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <CreditCard size={20} className="mb-1" /> Tarjeta
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? 'Procesando...' : 'COBRAR'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Historial de Ventas Premium */
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold flex items-center text-slate-800 dark:text-white mb-2">
                <Receipt className="mr-2 text-indigo-500" /> Registro de Ventas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Explora todas las transacciones recientes y los productos vendidos en cada una.</p>
            </div>
            <ExcelActions data={salesHistory} filename="Historial_Ventas" />
          </div>

          {historyLoading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p>No se encontraron ventas</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">ID Venta</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Método</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Productos</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300 text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sale: any) => (
                    <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{sale.invoice_number || sale.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">{sale.payment_method}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                        {sale.details?.map((d: any, idx: number) => (
                           <div key={idx} className="mb-1">{d.quantity}x {d.product_name} <span className="text-slate-400">(${d.unit_price.toLocaleString()})</span></div>
                        ))}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">${sale.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => printReceipt(sale)} 
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 p-2 rounded-lg transition"
                          title="Imprimir Recibo"
                        >
                          <Printer size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <span className="text-sm text-slate-600 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, products.length)} de {products.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

            </div>
          )}
        </div>
      )}

      {/* Modal Seleccionar Lote */}
      {batchModalProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md transition-colors">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center">
              Seleccionar Lote
            </h2>
            <p className="text-sm text-slate-500 mb-4">El producto <b>{batchModalProduct.name}</b> tiene varios lotes de inventario disponibles con precios distintos. Selecciona de cuál lote vas a vender:</p>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(batchModalProduct.batches || []).filter(b => b.current_stock > 0).map(batch => (
                <button 
                  key={batch.id}
                  onClick={() => addToCart(batchModalProduct, batch)}
                  className="w-full flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-all group"
                >
                  <div>
                    <div className="text-xs text-slate-400 font-bold mb-1">ID: {batch.id.substring(0,8)}</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Costo: ${Number(batch.cost_price).toLocaleString()}
                    </div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      Precio: ${Number(batch.selling_price).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold block mb-2">
                      {batch.current_stock} un. Disp.
                    </span>
                    <span className="text-indigo-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">Vender &rarr;</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setBatchModalProduct(null)} 
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
