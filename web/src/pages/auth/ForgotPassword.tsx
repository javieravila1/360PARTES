import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';

const forgotSchema = z.object({
  email: z.string().email('Correo inválido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      // Ajusta este endpoint según lo programe tu backend
      await apiClient.post('/auth/forgot-password', { email: data.email });
      toast.success('Se ha enviado un PIN a tu correo');
      // Redirigimos a la vista de reset, pasándole el correo por query param
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al enviar el correo');
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
            Recupera tu <br/><span className="text-indigo-400">Acceso</span>
          </h1>
          <p className="text-slate-300 text-lg font-normal leading-relaxed max-w-md">
            Ingresa tu correo electrónico y te enviaremos un PIN de 6 dígitos para restablecer tu contraseña.
          </p>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl shadow-black/40 border border-slate-100/10 dark:border-slate-700/50 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">Recuperar Contraseña</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Te enviaremos un código PIN a tu correo</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/50 dark:text-white p-3.5 text-sm transition-all outline-none"
                  placeholder="Correo Electrónico"
                />
                {errors.email && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.email.message}</p>}
              </div>

              <div className="flex justify-between items-center mt-4">
                <Link to="/login" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                  Volver al inicio de sesión
                </Link>
                <Link to="/reset-password" className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Ya tengo un PIN
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar PIN'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
