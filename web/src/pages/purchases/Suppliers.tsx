import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { ExcelActions } from '../../components/ExcelActions';

interface BusinessResponse {
  business: { id: string; name: string };
  role: string;
}

interface Supplier {
  id: string;
  company_name: string;
  document_id?: string;
  contact_person?: string;
  phone?: string;
  is_active: boolean;
}

export default function Suppliers() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = suppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ company_name: '', document_id: '', contact_person: '', phone: '' });
  
  const [userBusinesses, setUserBusinesses] = useState<BusinessResponse[]>([]);
  const [selectedExtraBusinesses, setSelectedExtraBusinesses] = useState<string[]>([]);

  const fetchBusinesses = async () => {
    try {
      const { data } = await apiClient.get('/businesses/');
      setUserBusinesses(data);
    } catch (error) {
      console.error('Error fetching businesses');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await apiClient.get('/contacts/suppliers');
      setSuppliers(data);
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      fetchSuppliers();
    }
    fetchBusinesses();
  }, [currentBusiness]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/contacts/suppliers/${editingId}`, formData);
        toast.success('Proveedor actualizado');
      } else {
        await apiClient.post('/contacts/suppliers', {
          ...formData,
          additional_business_ids: selectedExtraBusinesses
        });
        toast.success('Proveedor registrado');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ company_name: '', document_id: '', contact_person: '', phone: '' });
      setSelectedExtraBusinesses([]);
      fetchSuppliers();
    } catch (error) {
      toast.error('Error al guardar proveedor');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/contacts/suppliers/${id}`);
      toast.success('Proveedor eliminado');
      fetchSuppliers();
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Error al eliminar proveedor');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Truck className="mr-3 text-indigo-600" /> Directorio de Proveedores
        </h1>
        <div className="flex gap-2">
          <ExcelActions data={suppliers} filename="Proveedores" />
          <button 
            onClick={() => {
              setFormData({ company_name: '', document_id: '', contact_person: '', phone: '' });
              setSelectedExtraBusinesses([]);
              setEditingId(null);
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
          >
            <Plus size={20} className="mr-2" /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NIT/RUT</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">No hay proveedores registrados</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{s.company_name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.document_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.contact_person || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.phone || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ 
                          company_name: s.company_name, 
                          document_id: s.document_id || '', 
                          contact_person: s.contact_person || '', 
                          phone: s.phone || '' 
                        });
                        setEditingId(s.id);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(s.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, suppliers.length)} de {suppliers.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
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
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block label-field dark:text-slate-200">Nombre de la Empresa</label>
                <input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">NIT / Documento</label>
                <input value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Persona de Contacto</label>
                <input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>
              <div>
                <label className="block label-field dark:text-slate-200">Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-lg input-field" />
              </div>

              {!editingId && userBusinesses.length > 1 && (
                <div className="pt-2">
                  <label className="block label-field dark:text-slate-200 mb-2">También agregar a los siguientes negocios:</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {userBusinesses
                      .filter(b => b.business.id !== currentBusiness?.id)
                      .map(b => (
                        <label key={b.business.id} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedExtraBusinesses.includes(b.business.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtraBusinesses([...selectedExtraBusinesses, b.business.id]);
                              } else {
                                setSelectedExtraBusinesses(selectedExtraBusinesses.filter(id => id !== b.business.id));
                              }
                            }}
                          />
                          <span>{b.business.name}</span>
                        </label>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
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
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">¿Eliminar proveedor?</h3>
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
