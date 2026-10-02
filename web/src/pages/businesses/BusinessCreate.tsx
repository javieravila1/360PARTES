import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { useBusinessStore } from '../../store/businessStore';

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
    <div className="min-h-screen w-full relative flex font-sans flex-row-reverse">
      {/* Full screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      ></div>
      
      {/* Dark Overlay over the whole screen */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-indigo-900/60 to-slate-900/90 mix-blend-multiply"></div>

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row-reverse">
        
        {/* Right side (Text) */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 text-white text-right ml-auto">
          <div className="flex items-center justify-end gap-3 mb-10">
            <span className="font-semibold text-3xl tracking-tight">360<span className="text-indigo-400">PARTES</span></span>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
              360
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-tight">
            Expande tu <br/><span className="text-indigo-400">Imperio</span>
          </h1>
          <p className="text-slate-300 text-lg font-normal leading-relaxed max-w-md ml-auto">
            Configura y lanza nuevas sucursales al instante. Todo tu inventario y facturación consolidados.
          </p>
        </div>

        {/* Left side (Form Card) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          
          {/* Botón volver (flotante) */}
          <button onClick={() => navigate('/businesses')} className="absolute top-8 left-8 flex items-center text-slate-300 hover:text-white font-semibold transition bg-white/10 hover:bg-white/20 py-2 px-4 rounded-xl shadow-sm border border-white/10 backdrop-blur-md">
            <ArrowLeft size={18} className="mr-2" /> Volver
          </button>

          <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl shadow-black/40 border border-slate-100/10 dark:border-slate-700/50 backdrop-blur-xl mt-12 lg:mt-0">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">Nuevo Negocio</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Ingresa los datos principales de tu tienda</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <input
                  {...register('name')}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="Nombre del Negocio (Ej. Repuestos XYZ)"
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('tax_id')}
                    className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                    placeholder="NIT / RUT (Opcional)"
                  />
                </div>
                <div>
                  <input
                    {...register('phone')}
                    className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                    placeholder="Teléfono (Opcional)"
                  />
                </div>
              </div>

              <div>
                <input
                  {...register('address')}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="Dirección (Opcional)"
                />
              </div>

              <div>
                <select
                  {...register('currency')}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                >
                  <option value="COP">Pesos Colombianos (COP)</option>
                  <option value="USD">Dólares (USD)</option>
                  <option value="MXN">Pesos Mexicanos (MXN)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-semibold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Creando...' : 'Crear Negocio'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
