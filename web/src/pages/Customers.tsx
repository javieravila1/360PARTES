import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';

interface Customer {
  id: string;
  name: string;
  document_id?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/contacts/customers', formData);
      toast.success('Cliente registrado');
      setShowModal(false);
      setFormData({ name: '', document_id: '', phone: '', email: '' });
      fetchCustomers();
    } catch (error) {
      toast.error('Error al registrar cliente');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Users className="mr-3 text-blue-600" /> Directorio de Clientes
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <Plus size={20} className="mr-2" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Documento</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Teléfono</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No hay clientes registrados</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.document_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{c.email || '-'}</td>
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
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Cliente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Documento / RUT</label>
                <input value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
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
