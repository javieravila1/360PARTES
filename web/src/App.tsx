import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import BusinessSelect from './pages/BusinessSelect';
import BusinessCreate from './pages/BusinessCreate';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes without Layout */}
        <Route path="/businesses" element={
          <ProtectedRoute>
            <BusinessSelect />
          </ProtectedRoute>
        } />
        <Route path="/businesses/new" element={
          <ProtectedRoute>
            <BusinessCreate />
          </ProtectedRoute>
        } />
        
        {/* Protected Routes with Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="brands" element={<Brands />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
