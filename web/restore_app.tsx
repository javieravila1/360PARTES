import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">360PARTES</h1>
        <p className="text-gray-600 mb-6">
          Sistema multinegocio para la gestión de inventario, ventas, compras y repuestos.
        </p>
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition">
            Iniciar Sesión
          </button>
          <button className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded hover:bg-gray-300 transition">
            Crear Negocio
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
