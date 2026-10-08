import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { Database, Server, Settings2, Activity, HardDriveDownload, Key, Eye, EyeOff } from 'lucide-react';

export default function Configuration() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    checkStatus();
    // Load maintenance mode from local storage for now
    const maintenance = localStorage.getItem('maintenance_mode') === 'true';
    setIsMaintenance(maintenance);
  }, []);

  const checkStatus = async () => {
    setBackendStatus('checking');
    try {
      const res = await apiClient.get('/health');
      if (res.data && res.data.status === 'ok') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (e) {
      setBackendStatus('offline');
    }
  };

  const handleBackup = async () => {
    try {
      toast.info('Iniciando copia de seguridad...', { autoClose: 2000 });
      const res = await apiClient.post('/system/backup', {}, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      // Intenta obtener el nombre del archivo del header Content-Disposition si es posible
      let filename = 'backup.dump';
      const disposition = res.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Backup descargado correctamente`);
    } catch (e: any) {
      console.error('Backup error:', e);
      console.error('Response data:', e.response?.data);
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        console.error('Blob text:', text);
        toast.error('Error en backup: ' + text);
      } else {
        toast.error('Error de conexión al solicitar el backup: ' + (e.response?.data?.error || e.message));
      }
    }
  };

  const toggleMaintenance = () => {
    const newVal = !isMaintenance;
    setIsMaintenance(newVal);
    localStorage.setItem('maintenance_mode', String(newVal));
    toast.success(newVal ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
    if (newVal) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleChangePassword = async () => {
    try {
      await apiClient.put('/auth/change-password', {
        current_password: passwords.current,
        new_password: passwords.new
      });
      toast.success('Contraseña actualizada correctamente');
      setPasswords({ current: '', new: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings2 className="text-blue-600" />
          Configuración del Sistema
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Administra la base de datos y estado del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Backend Status Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Estado del Servidor</h2>
              <p className="text-sm text-slate-500">Verifica la conexión con el backend</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-4">
            <span className="font-medium text-slate-700 dark:text-slate-300">API Backend</span>
            <div className="flex items-center gap-2">
              {backendStatus === 'checking' && <span className="text-slate-500 text-sm">Comprobando...</span>}
              {backendStatus === 'online' && (
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  En línea
                </span>
              )}
              {backendStatus === 'offline' && (
                <span className="flex items-center gap-1.5 text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Fuera de línea
                </span>
              )}
            </div>
          </div>

          <button
            onClick={checkStatus}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Activity size={18} />
            Revisar Estado
          </button>
        </div>

        {/* Database Backup Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Base de Datos</h2>
              <p className="text-sm text-slate-500">Gestión de datos y copias de seguridad</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Realiza una copia de seguridad manual de toda la base de datos PostgreSQL. El archivo se guardará en el servidor.
          </p>

          <button
            onClick={handleBackup}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-sm"
          >
            <HardDriveDownload size={20} />
            Generar Backup (.dump)
          </button>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Seguridad</h2>
              <p className="text-sm text-slate-500">Cambia la contraseña de tu cuenta</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contraseña Actual</label>
              <input type={showPasswords ? "text" : "password"} value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm outline-none pr-10" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nueva Contraseña</label>
              <input type={showPasswords ? "text" : "password"} value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 bg-white dark:bg-slate-700 dark:text-white p-3 text-sm outline-none pr-10" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={!passwords.current || !passwords.new}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Actualizar Contraseña
            </button>
          </div>
        </div>

        {/* Maintenance Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 md:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isMaintenance ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Modo Mantenimiento</h2>
              <p className="text-sm text-slate-500">Bloquea el acceso temporalmente a los usuarios</p>
            </div>
          </div>

          <button
            onClick={toggleMaintenance}
            className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${isMaintenance
                ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
          >
            {isMaintenance ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}
          </button>
        </div>

      </div>
    </div>
  );
}
