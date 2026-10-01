import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useBusinessStore } from '../store/businessStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { LogOut, ChevronDown, Store, Package, ShoppingCart, Users, Home, Tag, FolderTree, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

interface Business {
  id: string;
  name: string;
  currency: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness);
  const logout = useAuthStore((state) => state.logout);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  if (!currentBusiness) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-1.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Package size={22} strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
              360PARTES
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <Link to="/dashboard" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Home className="mr-3" size={20} /> Dashboard
          </Link>
          <Link to="/sales" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <ShoppingCart className="mr-3" size={20} /> Ventas
          </Link>
          <Link to="/purchases" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Truck className="mr-3" size={20} /> Compras / Gastos
          </Link>
          <Link to="/products" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Package className="mr-3" size={20} /> Inventario
          </Link>
          <Link to="/categories" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <FolderTree className="mr-3" size={20} /> Categorías
          </Link>
          <Link to="/brands" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Tag className="mr-3" size={20} /> Marcas
          </Link>
          <Link to="/customers" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Users className="mr-3" size={20} /> Clientes
          </Link>
          <Link to="/suppliers" className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <Truck className="mr-3" size={20} /> Proveedores
          </Link>

        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          
          {/* Business Selector */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
            >
              <Store size={18} className="text-blue-600" />
              <span className="font-semibold text-slate-700">{currentBusiness.name}</span>
              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Cambiar de negocio</div>
                {businesses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleBusinessSwitch(b)}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition ${b.id === currentBusiness.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                  >
                    {b.name}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <Link to="/businesses" className="block px-4 py-2 text-blue-600 hover:bg-slate-50 transition text-sm">
                    Ver todos mis negocios
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User actions */}
          <div>
            <button onClick={handleLogout} className="flex items-center text-slate-500 hover:text-red-500 transition">
              <LogOut size={20} className="mr-2" />
              Salir
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
