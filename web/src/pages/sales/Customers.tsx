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

export default function Customers() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', document_id: '', phone: '', email: '' });

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

  useEffect(() => {
    if (currentBusiness) {
      fetchCustomers();
    }
  }, [currentBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/contacts/customers/${editingId}`, formData);
        toast.success('Cliente actualizado');
      } else {
        await apiClient.post('/contacts/customers', formData);
        toast.success('Cliente registrado');
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
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await apiClient.delete(`/contacts/customers/${id}`);
      toast.success('Cliente eliminado');
      fetchCustomers();
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
          <button 
            onClick={() => {
              setFormData({ name: '', document_id: '', phone: '', email: '' });
              setEditingId(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
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
              customers.map(c => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.document_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{c.email || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ 
                          name: c.name, 
                          document_id: c.document_id || '', 
                          phone: c.phone || '', 
                          email: c.email || '' 
                        });
                        setEditingId(c.id);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="floating-container p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
