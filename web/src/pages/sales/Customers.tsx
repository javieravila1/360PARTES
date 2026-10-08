import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { ExcelActions } from '../../components/ExcelActions';

interface Customer {
  id: string;
  name: string;
  document_id?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface Business {
  id: string;
  name: string;
}

export default function Customers() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', document_id: '', phone: '', email: '' });

  // Multi-business
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);

  const fetchCustomers = async () => {
    try {
      const { data } = await apiClient.get('/contacts/customers');
      setCustomers(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data } = await apiClient.get('/businesses/');
      setAllBusinesses(data.map((b: any) => ({ id: b.business.id, name: b.business.name })));
    } catch (_) {}
  };

  useEffect(() => {
    if (currentBusiness) {
      fetchCustomers();
      fetchBusinesses();
    }
  }, [currentBusiness]);

  const openNewModal = () => {
    setFormData({ name: '', document_id: '', phone: '', email: '' });
    setEditingId(null);
    setSelectedBusinessIds(currentBusiness ? [currentBusiness.id] : []);
    setShowModal(true);
  };

  const toggleBusiness = (id: string) => {
    setSelectedBusinessIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/contacts/customers/${editingId}`, formData);
        toast.success('Cliente actualizado');
      } else {
        const additionalIds = selectedBusinessIds.filter(id => id !== currentBusiness?.id);
        await apiClient.post('/contacts/customers', {
          ...formData,
          additional_business_ids: additionalIds.length > 0 ? additionalIds : undefined,
        });
        toast.success(`Cliente registrado en ${selectedBusinessIds.length} negocio(s)`);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', document_id: '', phone: '', email: '' });
      fetchCustomers();
    } catch (error) {
      toast.error('Error al guardar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/contacts/customers/${id}`);
      toast.success('Cliente eliminado');
      fetchCustomers();
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Error al eliminar cliente');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Users className="mr-3 text-blue-600" /> Directorio de Clientes
        </h1>
        <div className="flex gap-2">
          <ExcelActions data={customers} filename="Clientes" />
          <button onClick={openNewModal} className="btn-primary">
            <Plus size={20} className="mr-2" /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documento</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">No hay clientes registrados</td></tr>
            ) : (
              customers.slice(indexOfFirstItem, indexOfLastItem).map(c => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.document_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.email || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ name: c.name, document_id: c.document_id || '', phone: c.phone || '', email: c.email || '' });
                        setEditingId(c.id);
                        setSelectedBusinessIds([]);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, customers.length)} de {customers.length}</span>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">Anterior</button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="floating-container p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block label-field dark:text-slate-200">Nombre Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Documento / RUT</label>
                <input value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Correo Electrónico</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>

              {/* Selección multi-negocio solo al crear */}
              {!editingId && allBusinesses.length > 1 && (
                <div>
                  <label className="block label-field dark:text-slate-200 mb-2">Añadir también a estos negocios</label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 max-h-44 overflow-y-auto">
                    {allBusinesses.map(b => (
                      <label key={b.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBusinessIds.includes(b.id)}
                          onChange={() => toggleBusiness(b.id)}
                          disabled={b.id === currentBusiness?.id}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {b.name}
                          {b.id === currentBusiness?.id && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">(actual)</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">Guardar</button>
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
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">¿Eliminar cliente?</h3>
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
