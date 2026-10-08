import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Store, Plus, Edit2, Trash2, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

interface Business {
  id: string;
  name: string;
  logo?: string;
  currency: string;
}

interface BusinessResponse {
  business: Business;
  role: string;
}

export default function BusinessSelect() {
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness);
  const { logout } = useAuthStore();

  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchBusinesses = async () => {
    try {
      const response = await apiClient.get('/businesses/');
      setBusinesses(response.data);
    } catch (error) {
      toast.error('Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleDelete = async () => {
    if (!deletingBusiness) return;
    try {
      await apiClient.delete(`/businesses/${deletingBusiness.id}`);
      toast.success('Negocio eliminado');
      setShowDeleteModal(false);
      setDeletingBusiness(null);
      fetchBusinesses();
    } catch (error) {
      toast.error('Error al eliminar negocio (solo el dueño puede)');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;
    try {
      await apiClient.put(`/businesses/${editingBusiness.id}`, editingBusiness);
      toast.success('Negocio actualizado');
      setShowEditModal(false);
      setEditingBusiness(null);
      fetchBusinesses();
    } catch (error) {
      toast.error('Error al actualizar negocio (solo el dueño puede)');
    }
  };

  const handleSelect = (business: Business) => {
    setCurrentBusiness(business);
    navigate('/dashboard');
  };

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Mis Negocios</h1>
            <p className="text-slate-600 dark:text-slate-300">¿Qué negocio quieres administrar?</p>
          </div>
          <button 
            onClick={() => logout().then(() => navigate('/login'))}
            className="flex items-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-semibold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <LogOut size={18} className="mr-2" /> Salir al Login
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {businesses.map(({ business, role }) => (
            <div 
              key={business.id} 
              onClick={() => handleSelect(business)}
              className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-blue-500 dark:hover:border-blue-400 transition cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBusiness(business);
                    setShowEditModal(true);
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingBusiness(business);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <Store size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{business.name}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                {role}
              </span>
            </div>
          ))}

          <div 
            onClick={() => navigate('/businesses/new')}
            className="bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Plus size={48} className="mb-2" />
            <span className="font-semibold">Crear Nuevo Negocio</span>
          </div>
        </div>
      </div>

      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="floating-container p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Negocio</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block label-field dark:text-slate-200">Nombre</label>
                <input 
                  required
                  value={editingBusiness.name}
                  onChange={(e) => setEditingBusiness({...editingBusiness, name: e.target.value})}
                  className="mt-1 block w-full rounded-lg input-field" 
                />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Moneda</label>
                <input 
                  required
                  value={editingBusiness.currency}
                  onChange={(e) => setEditingBusiness({...editingBusiness, currency: e.target.value})}
                  className="mt-1 block w-full rounded-lg input-field" 
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deletingBusiness && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="floating-container p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Eliminar Negocio</h2>
            <p className="mb-6">¿Estás seguro de que quieres eliminar <strong>{deletingBusiness.name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
