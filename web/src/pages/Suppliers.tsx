import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

interface Supplier {
  id: string;
  company_name: string;
  document_id?: string;
  contact_person?: string;
  phone?: string;
  is_active: boolean;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ company_name: '', document_id: '', contact_person: '', phone: '' });

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
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/contacts/suppliers', formData);
      toast.success('Proveedor registrado');
      setShowModal(false);
      setFormData({ company_name: '', document_id: '', contact_person: '', phone: '' });
      fetchSuppliers();
    } catch (error) {
      toast.error('Error al registrar proveedor');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Truck className="mr-3 text-indigo-600" /> Directorio de Proveedores
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <Plus size={20} className="mr-2" /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Empresa</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">NIT/RUT</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contacto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Teléfono</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No hay proveedores registrados</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{s.company_name}</td>
                  <td className="px-6 py-4 text-slate-600">{s.document_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{s.contact_person || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{s.phone || '-'}</td>
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
            <h2 className="text-xl font-bold mb-4">Nuevo Proveedor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre de la Empresa</label>
                <input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">NIT / Documento</label>
                <input value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Persona de Contacto</label>
                <input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-lg border-slate-300 border p-2" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
