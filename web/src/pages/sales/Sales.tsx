
import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, User, Calendar, History, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';

interface Product {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  brand_id?: string;
  category_id?: string;
}

interface CartItem extends Product {
  cart_quantity: number;
}

export default function Sales() {
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>('POS');

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
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterBrandId, setFilterBrandId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // History States
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

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

  const updatePrice = (id: string, newPrice: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, selling_price: newPrice } : item));
  };

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      toast.warning('Producto agotado');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cart_quantity >= product.current_stock) {
          toast.warning('Stock máximo alcanzado para este producto');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cart_quantity: item.cart_quantity + 1 } : item);
      }
      return [...prev, { ...product, cart_quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
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

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.cart_quantity), 0);
  const total = subtotal;

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
        quantity: item.cart_quantity,
        unit_price: item.selling_price,
        discount: 0
      }))
    };

    try {
      await apiClient.post('/sales/', saleData);
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
                  <div key={item.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{item.name}</h4>
                      <div className="flex items-center mt-1 gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Precio Venta:</span>
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={item.selling_price}
                          onChange={e => updatePrice(item.id, Number(e.target.value))}
                          className="w-20 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-1 py-0.5 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-600 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-500 rounded text-slate-600 dark:text-slate-300"><Minus size={16} /></button>
                        <span className="w-8 text-center font-semibold text-sm">{item.cart_quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-500 rounded text-slate-600 dark:text-slate-300"><Plus size={16} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
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
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'CASH' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Banknote size={20} className="mb-1" /> Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'TRANSFER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Landmark size={20} className="mb-1" /> Transf.
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition ${paymentMethod === 'CARD' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <CreditCard size={20} className="mb-1" /> Tarjeta
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100"
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
            <button 
              onClick={() => {
                const headers = ['ID Venta', 'Fecha', 'Método Pago', 'Total Pagado', 'Productos (Cant x Nombre)'];
                const rows = salesHistory.map(sale => {
                  const date = new Date(sale.created_at).toLocaleString();
                  const products = sale.details?.map((d: any) => `${d.quantity}x ${d.product_name}`).join(' | ') || '';
                  return [
                    sale.id.substring(0, 8),
                    `"${date}"`,
                    sale.payment_method,
                    sale.total,
                    `"${products}"`
                  ].join(',');
                });
                const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `ventas_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center"
            >
              Exportar a Excel
            </button>
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
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sale: any) => (
                    <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{sale.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">{sale.payment_method}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                        {sale.details?.map((d: any, idx: number) => (
                           <div key={idx} className="mb-1">{d.quantity}x {d.product_name} <span className="text-slate-400">(${d.unit_price.toLocaleString()})</span></div>
                        ))}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">${sale.total.toLocaleString()}</td>
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
    </div>
  );
}
