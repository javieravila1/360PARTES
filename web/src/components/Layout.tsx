import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useBusinessStore } from '../store/businessStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { LogOut, ChevronDown, Store, Package, ShoppingCart, Users, Tag, FolderTree, Truck, LayoutDashboard, Settings, Sun, Moon, Undo2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Business {
  id: string;
  name: string;
  currency: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness);
  const logout = useAuthStore((state) => state.logout);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!currentBusiness) {
      navigate('/businesses');
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const response = await apiClient.get('/businesses/');
        setBusinesses(response.data.map((b: any) => b.business));
      } catch (error) {
        console.error("Error loading businesses", error);
      }
    };
    fetchBusinesses();

    // WebSocket Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // For localhost dev, use localhost:8000. In production, use the same host.
    // apiClient base URL is usually http://localhost:8000/api/v1
    const wsUrl = apiClient.defaults.baseURL?.replace('http', 'ws') + '/ws' || `${protocol}//${window.location.hostname}:8000/api/v1/ws`;
    
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      if (event.data === currentBusiness.id || event.data === "all") {
        window.dispatchEvent(new Event('db_updated'));
      }
    };
    
    return () => ws.close();
  }, [currentBusiness, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBusinessSwitch = (business: Business) => {
    setCurrentBusiness(business);
    setDropdownOpen(false);
    toast.info(`Cambiado a ${business.name}`);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!currentBusiness) return null;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        title={!sidebarOpen ? label : ""}
        className={`flex items-center mx-3 my-1.5 rounded-xl transition-all font-semibold text-sm ${sidebarOpen ? 'px-4 py-3' : 'justify-center py-3 px-0'} ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Icon className={`${sidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} size={20} />
        {sidebarOpen && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-800 dark:text-slate-100 p-4 gap-4 transition-colors duration-300">
      {/* Floating Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} floating-container flex flex-col hidden md:flex h-full overflow-hidden transition-all duration-300`}>
        <div className={`h-20 flex items-center border-b border-slate-100 dark:border-slate-700/50 ${sidebarOpen ? 'px-8' : 'justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md flex-shrink-0 tracking-tighter">
              360
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white transition-opacity duration-300 whitespace-nowrap">
                360<span className="text-indigo-600 dark:text-indigo-400">PARTES</span>
              </span>
            )}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 scrollbar-hide overflow-x-hidden">
          <div className={`text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ${sidebarOpen ? 'px-7' : 'text-center'}`}>
            {sidebarOpen ? 'Principal' : '•••'}
          </div>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/sales" icon={ShoppingCart} label="Ventas" />
          
          <div className={`text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 mt-8 ${sidebarOpen ? 'px-7' : 'text-center'}`}>
            {sidebarOpen ? 'Inventario' : '•••'}
          </div>
          <NavItem to="/products" icon={Package} label="Productos" />
          <NavItem to="/categories" icon={FolderTree} label="Categorías" />
          <NavItem to="/brands" icon={Tag} label="Marcas" />
          
          <div className={`text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 mt-8 ${sidebarOpen ? 'px-7' : 'text-center'}`}>
            {sidebarOpen ? 'Gestión' : '•••'}
          </div>
          <NavItem to="/purchases" icon={Truck} label="Compras & Gastos" />
          <NavItem to="/customers" icon={Users} label="Clientes" />
          <NavItem to="/suppliers" icon={Store} label="Proveedores" />
          <NavItem to="/returns" icon={Undo2} label="Devoluciones" />
        </nav>
        
        <div className="p-4">
          <Link to="/config" className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors cursor-pointer ${sidebarOpen ? 'p-3 gap-3' : 'justify-center p-3'}`}>
            <div className="w-10 h-10 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <Settings size={18} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">Configuración</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Sistema</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative rounded-2xl gap-4">
        {/* Floating Header */}
        <header className="h-16 floating-container flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex-1 flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden md:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Administración</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
              title="Cambiar tema"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Business Selector */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Store size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{currentBusiness.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cambiar negocio</div>
                  </div>
                  <div className="py-2 px-2 max-h-72 overflow-y-auto">
                    {businesses.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleBusinessSwitch(b)}
                        className={`w-full text-left flex items-center px-4 py-2.5 rounded-xl transition-all text-sm ${b.id === currentBusiness.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'}`}
                      >
                        <Store size={16} className={`mr-3 ${b.id === currentBusiness.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        {b.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700/50 mt-1 p-2">
                    <Link to="/businesses" className="block px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all text-sm font-bold text-center">
                      Administrar Negocios
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center pl-5 border-l border-slate-200 dark:border-slate-700 gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                A
              </div>
              <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm" title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto rounded-2xl z-10 transition-colors duration-300 scrollbar-hide">
          <div className="h-full pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
