import { useState } from 'react';
import { Settings2 } from 'lucide-react';

export default function Maintenance({ isServerDown = false }: { isServerDown?: boolean }) {
  const [clicks, setClicks] = useState(0);

  const handleSecretClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (newClicks >= 5) {
      localStorage.setItem('maintenance_mode', 'false');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-10 text-center shadow-xl border border-slate-100 dark:border-slate-700">
        <div
          className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer"
          onClick={handleSecretClick}
        >
          <Settings2 size={48} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          {isServerDown ? 'Conexión Perdida' : 'Estamos en Mantenimiento'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {isServerDown
            ? 'El servidor principal se encuentra fuera de línea o inaccesible. Estamos intentando reconectar automáticamente.'
            : 'Estamos realizando algunas mejoras para ofrecerte una mejor experiencia. Estaremos de vuelta muy pronto. ¡Gracias por tu paciencia!'}
        </p>
        <div className="h-1.5 w-32 bg-slate-100 dark:bg-slate-700 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-progress"></div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 50%; }
          100% { width: 100%; transform: translateX(200%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
