import React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ChecklistDashboard: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Check List de Vistoria
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/checklist/novo')} // Add onClick handler
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center text-lg transition-transform transform hover:scale-105"
        >
          <PlusCircle className="mr-3 h-6 w-6" />
          Nova Vistoria de Entrada
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center text-lg transition-transform transform hover:scale-105">
          <PlusCircle className="mr-3 h-6 w-6" />
          Nova Vistoria de Saída
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Consultar Vistorias
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por placa do veículo..."
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Últimas Vistorias Realizadas
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-8 text-center rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma vistoria encontrada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChecklistDashboard;

