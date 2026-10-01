import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import { TrendingUp, Users, Package } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      setToken(response.data.access_token);
      toast.success('Sesión iniciada correctamente');
      navigate('/businesses');
    } catch (error) {
      toast.error('Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-slate-50 dark:bg-slate-900">
      {/* Left side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-500 to-indigo-700 flex-col justify-center px-20 text-white relative overflow-hidden">
        {/* Abstract shapes & Dashboard Preview Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        
        {/* Floating UI Elements */}
        <div className="absolute top-[15%] right-[10%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform rotate-6 shadow-xl hover:rotate-0 transition-all duration-500 hidden xl:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-400/20 p-2 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
            <span className="font-semibold text-sm">Ventas del Día</span>
          </div>
          <span className="text-2xl font-black">$4,250.00</span>
        </div>

        <div className="absolute bottom-[20%] right-[20%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform -rotate-3 shadow-xl hover:rotate-0 transition-all duration-500 hidden xl:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-300"><Users size={20} /></div>
            <span className="font-semibold text-sm">Nuevos Clientes</span>
          </div>
          <span className="text-2xl font-black">+ 12 hoy</span>
        </div>

        <div className="absolute top-[40%] left-[5%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transform -rotate-6 shadow-xl hover:rotate-0 transition-all duration-500 hidden xl:block z-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-rose-400/20 p-2 rounded-lg text-rose-300"><Package size={20} /></div>
            <span className="font-semibold text-sm">Stock Bajo</span>
          </div>
          <span className="text-2xl font-black">5 items</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
              360
            </div>
            <span className="font-bold text-2xl tracking-wide">360PARTES</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 tracking-tight">¡Hola, Bienvenido!</h1>
          <p className="text-indigo-100 text-lg font-medium leading-relaxed">
            Te brindamos todas las herramientas para simplificar tus ventas, inventario y finanzas sin complicaciones adicionales.
          </p>
        </div>
      </div>
      
      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Ingresa a tu cuenta para continuar</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <input 
                {...register('email')}
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                placeholder="Correo Electrónico"
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.email.message}</p>}
            </div>

            <div>
              <input 
                type="password"
                {...register('password')}
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3.5 text-sm transition-all outline-none"
                placeholder="Contraseña"
              />
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition px-2">¿Olvidaste tu contraseña?</a>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1.5 font-medium px-2">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Iniciando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center mt-10 text-sm font-medium text-slate-500 dark:text-slate-400">
            ¿No tienes cuenta? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
