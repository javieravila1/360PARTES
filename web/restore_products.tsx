import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  image_url?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', sale_price: 0, cost_price: 0, current_stock: 0, image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/products/');
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      setFormData(prev => ({ ...prev, image_url: data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products/', formData);
      toast.success('Producto creado exitosamente');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error('Error al crear producto');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Inventario de Productos</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} className="mr-2" /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Imagen</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">SKU</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Precio Venta</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Stock</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No hay productos registrados</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                  <td className="px-6 py-4 text-slate-800 font-bold">${p.sale_price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.current_stock <= p.min_stock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 mr-3"><Edit size={18} /></button>
                    <button className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Registrar Nuevo Producto</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex gap-6 mb-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nombre del Producto</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Código / SKU</label>
                      <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Stock Inicial</label>
                      <input type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Costo ($)</label>
                      <input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Precio Venta ($)</label>
                      <input type="number" required value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: Number(e.target.value)})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
                    </div>
                  </div>
                </div>

                <div className="w-1/3 flex flex-col items-center">
                  <label className="block text-sm font-medium text-slate-700 mb-2 w-full text-center">Foto (MinIO)</label>
                  <div className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
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
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={uploadingImage} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">Guardar Producto</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
