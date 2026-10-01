import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchBrands = async () => {
    try {
      const { data } = await apiClient.get('/brands/');
      setBrands(data);
    } catch (error) {
      toast.error('Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/brands/', formData);
      toast.success('Marca creada');
      setShowModal(false);
      setFormData({ name: '', description: '' });
      fetchBrands();
    } catch (error) {
      toast.error('Error al crear marca');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Marcas</h1>
        <button 
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <Plus size={20} className="mr-2" /> Nueva Marca
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Descripción</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">No hay marcas registradas</td></tr>
            ) : (
              brands.map(brand => (
                <tr key={brand.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{brand.name}</td>
                  <td className="px-6 py-4 text-slate-600">{brand.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {brand.is_active ? 'Activo' : 'Inactivo'}
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

      {/* Modal Básico */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Marca</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-slate-300 border p-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-slate-300 border p-2" 
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
