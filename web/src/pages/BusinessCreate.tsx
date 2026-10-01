import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import { ArrowLeft, Globe, Briefcase, Activity } from 'lucide-react';
import { useBusinessStore } from '../store/businessStore';

const schema = z.object({
  name: z.string().min(2, 'Obligatorio'),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  currency: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessCreate() {
  const navigate = useNavigate();
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'COP'
    }
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/businesses/', data);
      toast.success('Negocio creado exitosamente');
      setCurrentBusiness(response.data);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear el negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Left side */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 flex-col justify-center px-20 text-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

        {/* Floating Feature Cards */}
        <div className="absolute top-[20%] right-[15%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform rotate-3 shadow-xl transition-all duration-500 hidden xl:block">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400/20 p-2 rounded-lg text-amber-300"><Briefcase size={20} /></div>
            <span className="font-semibold text-sm">Multinegocio</span>
          </div>
        </div>

        <div className="absolute bottom-[30%] right-[10%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform -rotate-3 shadow-xl transition-all duration-500 hidden xl:block">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-lg text-emerald-300"><Globe size={20} /></div>
            <span className="font-semibold text-sm">Accesible 24/7</span>
          </div>
        </div>

        <div className="absolute top-[60%] left-[10%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform rotate-6 shadow-xl transition-all duration-500 hidden xl:block">
          <div className="flex items-center gap-3">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-300"><Activity size={20} /></div>
            <span className="font-semibold text-sm">Control Total</span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
              360
            </div>
            <span className="font-bold text-2xl tracking-wide">360PARTES</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 tracking-tight">Crea tu Negocio</h1>
          <p className="text-indigo-100 text-lg font-medium leading-relaxed">
            Personaliza el perfil de tu tienda y comienza a registrar inventario, ventas y mucho más al instante.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-slate-50 dark:bg-slate-900 transition-colors">

        {/* Botón volver (flotante) */}
        <button onClick={() => navigate('/businesses')} className="absolute top-8 left-8 flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition bg-white dark:bg-slate-800 py-2 px-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <ArrowLeft size={18} className="mr-2" /> Volver
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 mt-12 lg:mt-0 transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Nuevo Negocio</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Ingresa los datos principales de tu tienda</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <input
                {...register('name')}
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                placeholder="Nombre del Negocio (Ej. Repuestos XYZ)"
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  {...register('tax_id')}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="NIT / RUT (Opcional)"
                />
              </div>
              <div>
                <input
                  {...register('phone')}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="Teléfono (Opcional)"
                />
              </div>
            </div>

            <div>
              <input
                {...register('address')}
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                placeholder="Dirección (Opcional)"
              />
            </div>

            <div>
              <select
                {...register('currency')}
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
              >
                <option value="COP">Pesos Colombianos (COP)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="MXN">Pesos Mexicanos (MXN)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Creando...' : 'Crear Negocio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
