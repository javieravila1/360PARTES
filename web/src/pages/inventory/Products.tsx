import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useBusinessStore } from '../../store/businessStore';
import { ExcelActions } from '../../components/ExcelActions';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  min_stock: number;
  image?: string;
  image_url?: string;
}

interface Brand { id: string; name: string; }
interface Category { id: string; name: string; }

export default function Products() {
  const { currentBusiness } = useBusinessStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [stockToAdd, setStockToAdd] = useState(0);
  const [costPriceToAdd, setCostPriceToAdd] = useState(0);
  const [sellingPriceToAdd, setSellingPriceToAdd] = useState(0);
  const [formData, setFormData] = useState<{
    name: string, sku: string, selling_price: number, cost_price: number, current_stock: number, image: string, brand_id: string, category_id: string, extra_business_ids: string[]
  }>({
    name: '', sku: '', selling_price: 0, cost_price: 0, current_stock: 0, image: '', brand_id: '', category_id: '', extra_business_ids: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, brandsRes, catRes, busRes] = await Promise.all([
        apiClient.get('/products/'),
        apiClient.get('/brands/'),
        apiClient.get('/categories/'),
        apiClient.get('/businesses/')
      ]);
      setProducts(prodRes.data.map((p: any) => ({
        ...p,
        selling_price: Number(p.selling_price || 0),
        cost_price: Number(p.cost_price || 0),
        current_stock: Number(p.current_stock || 0),
        min_stock: Number(p.min_stock || 0),
      })));
      setBrands(brandsRes.data);
      setCategories(catRes.data);
      if (currentBusiness) {
        setUserBusinesses(busRes.data.map((b: any) => b.business).filter((b: any) => b.id !== currentBusiness.id));
      }
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      fetchData();
    }
    const handler = () => { if (currentBusiness) fetchData(); };
    window.addEventListener('db_updated', handler);
    return () => window.removeEventListener('db_updated', handler);
  }, [currentBusiness]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imgData = new FormData();
    imgData.append('file', file);

    setUploadingImage(true);
    try {
      // POST a nuestro nuevo endpoint de MinIO
      const { data } = await apiClient.post('/files/upload', imgData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleEdit = (p: Product) => {
    setSelectedProductId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku,
      selling_price: p.selling_price,
      cost_price: p.cost_price,
      current_stock: p.current_stock,
      image: p.image_url || '',
      brand_id: (p as any).brand_id || '',
      category_id: (p as any).category_id || '',
      extra_business_ids: [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand_id) {
      return toast.warning('Por favor selecciona una marca');
    }
    if (!formData.category_id) {
      return toast.warning('Por favor selecciona una categoría');
    }

    try {
      const payload = {
        ...formData,
        brand_id: formData.brand_id,
        category_id: formData.category_id,
      };
      if (selectedProductId) {
        await apiClient.put(`/products/${selectedProductId}`, payload);
        toast.success('Producto actualizado exitosamente');
      } else {
        await apiClient.post('/products/', payload);
        toast.success('Producto creado exitosamente');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 dark:text-white">Inventario de Productos</h1>
        <div className="flex gap-2">
          <ExcelActions data={products} filename="Productos" />
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedProductId('');
              setFormData({ name: '', sku: '', selling_price: 0, cost_price: 0, current_stock: 0, image: '', brand_id: '', category_id: '', extra_business_ids: [] });
              setShowModal(true);
            }}
          >
            <Plus size={20} className="mr-2" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 transition-colors">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Imagen</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">SKU</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Precio Sugerido</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-300 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No hay productos registrados</td></tr>
            ) : (
              currentItems.map(p => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{p.sku}</td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100 dark:text-slate-200">{p.name}</td>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-100 dark:text-slate-200 font-bold">${Number(p.selling_price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.current_stock <= p.min_stock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {Number(p.current_stock || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={async () => {
                      setSelectedProductId(p.id);
                      try {
                        const { data } = await apiClient.get(`/products/${p.id}/history`);
                        setStockHistory(data);
                        setShowHistoryModal(true);
                      } catch (e) {
                        toast.error('Error al cargar historial');
                      }
                    }} className="text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-bold transition">
                      Historial
                    </button>
                    <button onClick={() => { setSelectedProductId(p.id); setStockToAdd(0); setCostPriceToAdd(p.cost_price); setSellingPriceToAdd(p.selling_price); setShowStockModal(true); }} className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-xs font-bold transition">
                      + Stock
                    </button>
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 ml-2"><Edit size={18} /></button>
                    <button onClick={() => setDeleteConfirmId(p.id)} className="text-red-600 hover:text-red-800 ml-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, products.length)} de {products.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full transition-colors max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 dark:text-white">
              {selectedProductId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="flex gap-6 mb-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Nombre del Producto</label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Código / SKU (Opcional)</label>
                      <input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Stock Inicial</label>
                      <input type="text" inputMode="numeric" value={formData.current_stock === 0 ? '' : formData.current_stock} onChange={e => { const val = e.target.value.replace(/\D/g, ''); let num = Number(val); if (num > 100000) num = 100000; setFormData({ ...formData, current_stock: num }); }} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Costo ($)</label>
                      <input type="text" inputMode="numeric" value={!formData.cost_price ? '' : formData.cost_price.toLocaleString('es-CO')} onChange={e => { const val = e.target.value.replace(/\D/g, ''); let num = Number(val); if (num > 1000000000) num = 1000000000; setFormData({ ...formData, cost_price: num }); }} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Precio Sugerido de venta ($)</label>
                      <input type="text" inputMode="numeric" required value={!formData.selling_price ? '' : formData.selling_price.toLocaleString('es-CO')} onChange={e => { const val = e.target.value.replace(/\D/g, ''); let num = Number(val); if (num > 1000000000) num = 1000000000; setFormData({ ...formData, selling_price: num }); }} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Marca</label>
                      <select required value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none">
                        <option value="">Ninguna</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Categoría</label>
                      <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none">
                        <option value="">Ninguna</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {!selectedProductId && userBusinesses.length > 0 && (
                    <div className="col-span-2 pt-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">
                        Copiar a otros de mis negocios (Opcional)
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {userBusinesses.map(b => (
                          <label key={b.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={formData.extra_business_ids.includes(b.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, extra_business_ids: [...prev.extra_business_ids, b.id] }));
                                } else {
                                  setFormData(prev => ({ ...prev, extra_business_ids: prev.extra_business_ids.filter(id => id !== b.id) }));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{b.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  <label className="block label-field dark:text-slate-200 mb-2 w-full text-center">Foto (MinIO)</label>
                  <div className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="text-slate-400 mb-2" size={32} />
                        <span className="text-sm text-slate-500 text-center px-4">Sube la foto del repuesto</span>
                      </>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center font-bold text-blue-600">
                        Subiendo...
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={uploadingImage} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">Guardar Producto</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm transition-colors">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 dark:text-white">Incrementar Stock</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Cantidad a Ingresar</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={stockToAdd === 0 ? '' : stockToAdd} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  let num = Number(val);
                  if (num > 1000000) num = 1000000;
                  setStockToAdd(num);
                }} 
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-lg text-center font-bold transition-all outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Nuevo Costo ($)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={!costPriceToAdd ? '' : costPriceToAdd.toLocaleString('es-CO')} 
                  onChange={e => { const val = e.target.value.replace(/\D/g, ''); let num = Number(val); if (num > 1000000000) num = 1000000000; setCostPriceToAdd(num); }}
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-1.5">Nuevo P. Venta ($)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={!sellingPriceToAdd ? '' : sellingPriceToAdd.toLocaleString('es-CO')} 
                  onChange={e => { const val = e.target.value.replace(/\D/g, ''); let num = Number(val); if (num > 1000000000) num = 1000000000; setSellingPriceToAdd(num); }}
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm transition-all outline-none" 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
              <button type="button" onClick={async () => {
                if (stockToAdd <= 0) return toast.warning('Ingrese una cantidad válida');
                try {
                  await apiClient.patch(`/products/${selectedProductId}/stock`, { 
                    quantity: stockToAdd, 
                    cost_price: costPriceToAdd, 
                    selling_price: sellingPriceToAdd 
                  });
                  toast.success('Stock actualizado');
                  setShowStockModal(false);
                  fetchData();
                } catch (e) {
                  toast.error('Error al actualizar stock');
                }
              }} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg transition-colors">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 dark:text-white flex items-center">
              Historial de Stock
            </h2>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
              {stockHistory.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No hay movimientos registrados.</p>
              ) : (
                stockHistory.map((mov, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 flex justify-between items-center">
                    <div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${mov.movement_type.includes('ENTRADA') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {mov.movement_type}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{new Date(mov.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 dark:text-slate-200">
                        {mov.movement_type.includes('ENTRADA') ? '+' : '-'}{mov.quantity}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold">{mov.previous_stock} &rarr; {mov.new_stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">¿Eliminar producto?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

