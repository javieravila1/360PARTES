import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { ExcelActions } from '../../components/ExcelActions';

interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export default function Brands() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = brands.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(brands.length / itemsPerPage);

  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const [allBusinesses, setAllBusinesses] = useState<{id: string, name: string}[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const { data } = await apiClient.get('/businesses/');
        setAllBusinesses(data.map((d: any) => d.business));
      } catch (error) {
        console.error(error);
      }
    };
    fetchBusinesses();
  }, []);

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
    if (currentBusiness) {
      fetchBrands();
    }
  }, [currentBusiness]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/brands/${editingId}`, { name: formData.name, description: formData.description });
        toast.success('Marca actualizada exitosamente');
      } else {
        const bids = selectedBusinesses.length > 0 ? selectedBusinesses : [currentBusiness?.id];
        await Promise.all(
          bids.map(bid => apiClient.post('/brands/', formData, { headers: { 'x-business-id': bid } }))
        );
        toast.success('Marca creada exitosamente');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
      fetchBrands();
    } catch (error) {
      toast.error('Error al guardar marca');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/brands/${id}`);
      toast.success('Marca eliminada');
      fetchBrands();
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Error al eliminar marca');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Marcas</h1>
        <div className="flex gap-2">
          <ExcelActions data={brands} filename="Marcas" />
          <button 
            onClick={() => {
              setFormData({ name: '', description: '' });
              setEditingId(null);
              setSelectedBusinesses(currentBusiness ? [currentBusiness.id] : []);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={20} className="mr-2" /> Nueva Marca
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">No hay marcas registradas</td></tr>
            ) : (
              brands.map(brand => (
                <tr key={brand.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{brand.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{brand.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {brand.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ name: brand.name, description: brand.description || '' });
                        setEditingId(brand.id);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(brand.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, brands.length)} de {brands.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      </div>

      {/* Modal Básico */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="floating-container p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Marca' : 'Nueva Marca'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block label-field dark:text-slate-200">Nombre</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-lg input-field" 
                />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full rounded-lg input-field" 
                />
              </div>
              {!editingId && (
                <div className="mt-4">
                  <label className="block label-field dark:text-slate-200 mb-2">Añadir a negocios</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  {allBusinesses.map(b => (
                    <label key={b.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedBusinesses.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedBusinesses([...selectedBusinesses, b.id]);
                          else setSelectedBusinesses(selectedBusinesses.filter(id => id !== b.id));
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="floating-container p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-5 border-4 border-white dark:border-slate-800 shadow-sm">
              <Trash2 size={28} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">¿Eliminar marca?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Esta acción es permanente y no se puede deshacer.</p>
            <div className="flex gap-3 justify-center w-full">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-sm hover:shadow"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
