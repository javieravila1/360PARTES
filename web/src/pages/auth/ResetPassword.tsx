import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Correo inválido'),
  pin: z.string().length(6, 'El PIN debe tener 6 dígitos'),
  new_password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm_password: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema)
  });

  useEffect(() => {
    // Si viene el correo por URL, lo rellenamos
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [location, setValue]);

  const onSubmit = async (data: ResetForm) => {
    try {
      // Ajusta el payload según tu backend
      await apiClient.post('/auth/reset-password', {
        email: data.email,
        pin: data.pin,
        new_password: data.new_password
      });
      toast.success('Contraseña restablecida correctamente');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al restablecer la contraseña');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex font-sans">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/60 to-slate-900/90 mix-blend-multiply"></div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
              360
            </div>
            <span className="font-semibold text-3xl tracking-tight">360<span className="text-indigo-400">PARTES</span></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-tight">
            Crea tu <br/><span className="text-indigo-400">Nueva Clave</span>
          </h1>
          <p className="text-slate-300 text-lg font-normal leading-relaxed max-w-md">
            Ingresa el PIN de 6 dígitos que enviamos a tu correo y establece tu nueva contraseña segura.
          </p>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl shadow-black/40 border border-slate-100/10 dark:border-slate-700/50 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">Cambiar Contraseña</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Ingresa el PIN recibido en tu correo</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="Correo Electrónico"
                />
                {errors.email && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.email.message}</p>}
              </div>

              <div>
                <input
                  {...register('pin')}
                  type="text"
                  maxLength={6}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none font-mono tracking-widest text-center text-lg"
                  placeholder="------"
                />
                {errors.pin && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2 text-center">{errors.pin.message}</p>}
              </div>

              <div className="relative">
                <input
                  {...register('new_password')}
                  type={showPassword ? "text" : "password"}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 pr-12 text-sm transition-all outline-none"
                  placeholder="Nueva Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.new_password && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.new_password.message}</p>}
              </div>

              <div className="relative">
                <input
                  {...register('confirm_password')}
                  type={showConfirmPassword ? "text" : "password"}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 pr-12 text-sm transition-all outline-none"
                  placeholder="Confirmar Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.confirm_password && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.confirm_password.message}</p>}
              </div>

              <div className="flex justify-end mt-2">
                <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Cancelar
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
