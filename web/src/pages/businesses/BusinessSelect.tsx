import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useBusinessStore } from '../../store/businessStore';
import { Store, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

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

  useEffect(() => {
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
    fetchBusinesses();
  }, []);

  const handleSelect = (business: Business) => {
    setCurrentBusiness(business);
    navigate('/dashboard');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Mis Negocios</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">¿Qué negocio quieres administrar?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {businesses.map(({ business, role }) => (
            <div 
              key={business.id} 
              onClick={() => handleSelect(business)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-500 transition cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <Store size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{business.name}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded-full">
                {role}
              </span>
            </div>
          ))}

          <div 
            onClick={() => navigate('/businesses/new')}
            className="bg-slate-100 border-2 border-dashed border-slate-300 p-6 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600"
          >
            <Plus size={48} className="mb-2" />
            <span className="font-semibold">Crear Nuevo Negocio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
