import re

with open("src/pages/Sales.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. State changes
state_imports = """
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, User, Calendar, Tag, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
"""

content = re.sub(
    r"import { useState, useEffect } from 'react';.*?import { toast } from 'react-toastify';",
    state_imports,
    content,
    flags=re.DOTALL
)

interface_def = """
interface Product {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  brand_id?: string;
  category_id?: string;
}
"""
content = re.sub(
    r"interface Product \{.*?\}",
    interface_def.strip(),
    content,
    flags=re.DOTALL,
    count=1
)

state_vars = """
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nuevos estados
  const [customers, setCustomers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterBrandId, setFilterBrandId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
"""

content = re.sub(
    r"const \[products.*?setIsSubmitting\(false\);",
    state_vars.strip(),
    content,
    flags=re.DOTALL
)

# 2. Fetch Data
fetch_effect = """
  useEffect(() => {
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
    fetchData();
  }, []);
"""

content = re.sub(
    r"useEffect\(\(\) => \{.*?\}, \[\]\);",
    fetch_effect.strip(),
    content,
    flags=re.DOTALL
)

# 3. Filtered products
filtered_products = """
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesBrand = filterBrandId ? p.brand_id === filterBrandId : true;
    const matchesCategory = filterCategoryId ? p.category_id === filterCategoryId : true;
    return matchesSearch && matchesBrand && matchesCategory;
  });
  
  const updatePrice = (id: string, newPrice: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, selling_price: newPrice } : item));
  };
"""
content = re.sub(
    r"const filteredProducts = products\.filter.*?\);",
    filtered_products.strip(),
    content,
    flags=re.DOTALL
)


# 4. Checkout Handler
checkout_handler = """
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    const saleData = {
      customer_id: selectedCustomerId || null,
      sale_date: saleDate,
      subtotal,
      total,
      payment_method: paymentMethod,
      payment_status: 'PAID', // Al ser 1 sola persona dueña, asumimos pago de contado al instante en POS
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
      // Refrescar inventario localmente
      const { data } = await apiClient.get('/products/');
      setProducts(data.map((p: any) => ({
        ...p,
        selling_price: Number(p.sale_price || p.selling_price || 0),
        current_stock: Number(p.current_stock || 0),
      })));
    } catch (error) {
      toast.error('Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };
"""

content = re.sub(
    r"const handleCheckout = async \(\) => \{.*?\};",
    checkout_handler.strip(),
    content,
    flags=re.DOTALL
)

# 5. UI Updates: Search Bar & Filters
ui_filters = """
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
"""

content = re.sub(
    r"<div className=\"p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50\">.*?</div>\n        </div>",
    ui_filters.strip(),
    content,
    flags=re.DOTALL
)

# 6. UI Updates: Cart Price Input
ui_cart_item = """
              <div key={item.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center shadow-sm">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{item.name}</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-slate-500 font-bold mr-1">$</span>
                    <input 
                      type="number" 
                      value={item.selling_price} 
                      onChange={e => updatePrice(item.id, Number(e.target.value))}
                      className="w-20 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-1 py-0.5 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none"
                    />
                  </div>
                </div>
"""

content = re.sub(
    r"<div key=\{item\.id\}.*?<h4.*?</h4>\s*<p.*?</p>\s*</div>",
    ui_cart_item.strip(),
    content,
    flags=re.DOTALL
)


# 7. UI Updates: Checkout Form Additions
ui_checkout = """
        {/* Checkout Area */}
        <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1"><User size={14} className="mr-1"/> Cliente</label>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none">
                <option value="">Consumidor Final</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1"><Calendar size={14} className="mr-1"/> Fecha Venta</label>
              <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          
          <div className="flex justify-between font-bold text-2xl text-slate-800 dark:text-white mb-6 pt-4 border-t border-slate-100 dark:border-slate-700">
"""

content = re.sub(
    r"\{\/\* Checkout Area \*\/\}\s*<div className=\"p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700\">\s*<div className=\"flex justify-between text-slate-500 mb-2\">\s*<span>Subtotal</span>\s*<span>\$\{subtotal\.toLocaleString\(\)\}</span>\s*</div>\s*<div className=\"flex justify-between font-bold text-2xl text-slate-800 dark:text-white mb-6\">",
    ui_checkout.strip(),
    content,
    flags=re.DOTALL
)

with open("src/pages/Sales.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Sales.tsx rewritten")
