import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600 mb-4">
            <span className="text-white font-bold text-2xl">VyR</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Voltios y Ruedas</h1>
          <p className="text-gray-600 mt-1">Sistema de gestión de taller automotriz</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Outlet />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Voltios y Ruedas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};