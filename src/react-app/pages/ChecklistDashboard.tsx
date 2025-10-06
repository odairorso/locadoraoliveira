import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Car, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChecklistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vistoriasPendentes, setVistoriasPendentes] = useState<any[]>([]); // Vistorias de saída pendentes
  const [vistoriasEntradaPendentes, setVistoriasEntradaPendentes] = useState<any[]>([]); // Vistorias de entrada pendentes
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarVistorias();
  }, []);

  const carregarVistorias = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vistorias');
      const result = await response.json();
      
      if (result.success && result.data.vistorias) {
        const todasVistorias = result.data.vistorias;
        
        // Separa as vistorias em pendentes de saída (lado esquerdo) e pendentes de entrada (lado direito)
        const pendentesSaida = todasVistorias.filter((v: { nome_vistoriador: string, tipo_vistoria: string }) => 
          v.nome_vistoriador === 'Sistema' && v.tipo_vistoria === 'saida');
        const pendentesEntrada = todasVistorias.filter((v: { nome_vistoriador: string, tipo_vistoria: string }) => 
          v.nome_vistoriador === 'Sistema' && v.tipo_vistoria === 'entrada');

      }
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Check List de Vistoria
      </h1>

      {/* Seção de Ações e Vistorias Pendentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Vistorias de Saída Pendentes */}
        <div className="bg-orange-50 dark:bg-gray-700 p-6 rounded-lg border border-orange-200 dark:border-orange-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Clock className="mr-3 h-6 w-6 text-orange-600" />
            Vistorias de Saída Pendentes
          </h2>
          {loading ? (
             <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
             </div>
          ) : vistoriasPendentes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {vistoriasPendentes.map((vistoria) => (
                <div
                  key={vistoria.id}
                  onClick={() => {
                    // Include locacao_id parameter if available to load entry inspection data
                    const url = vistoria.locacao_id 
                      ? `/checklist/editar/${vistoria.id}?locacaoId=${vistoria.locacao_id}&tipo=${vistoria.tipo_vistoria}`
                      : `/checklist/editar/${vistoria.id}?tipo=${vistoria.tipo_vistoria}`;
                    navigate(url);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    vistoria.tipo_vistoria === 'saida' 
                      ? 'border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-gray-600 bg-orange-50 dark:bg-gray-800'
                      : 'border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-600 bg-blue-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                     <Car className="h-5 w-5 mr-2 text-gray-500" />
                    {vistoria.placa} - {vistoria.modelo}
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                      vistoria.tipo_vistoria === 'saida' 
                        ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {vistoria.tipo_vistoria === 'saida' ? 'Saída' : 'Entrada'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Cliente: <span 
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = vistoria.locacao_id 
                          ? `/checklist/editar/${vistoria.id}?locacaoId=${vistoria.locacao_id}&tipo=${vistoria.tipo_vistoria}`
                          : `/checklist/editar/${vistoria.id}?tipo=${vistoria.tipo_vistoria}`;
                        navigate(url);
                      }}
                    >
                      {vistoria.nome_condutor}
                    </span>
                  </div>
                   <div className={`text-xs mt-2 font-semibold ${
                     vistoria.tipo_vistoria === 'saida' 
                       ? 'text-red-600 dark:text-red-400'
                       : 'text-blue-600 dark:text-blue-400'
                   }`}>
                    {vistoria.tipo_vistoria === 'saida' 
                      ? 'Clique para preencher e finalizar a vistoria de saída'
                      : 'Clique para preencher a vistoria de entrada (dados da saída serão carregados)'
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center p-4">Nenhuma vistoria de saída pendente.</p>
          )}
        </div>

        {/* Vistorias de Entrada Pendentes */}
        <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg border border-blue-200 dark:border-blue-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Clock className="mr-3 h-6 w-6 text-blue-600" />
            Vistorias de Entrada Pendentes
          </h2>
          {loading ? (
             <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
             </div>
          ) : vistoriasEntradaPendentes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {vistoriasEntradaPendentes.map((vistoria) => (
                <div
                  key={vistoria.id}
                  onClick={() => {
                    // Include locacao_id parameter if available to load entry inspection data
                    const url = vistoria.locacao_id 
                      ? `/checklist/editar/${vistoria.id}?locacaoId=${vistoria.locacao_id}&tipo=${vistoria.tipo_vistoria}`
                      : `/checklist/editar/${vistoria.id}?tipo=${vistoria.tipo_vistoria}`;
                    navigate(url);
                  }}
                  className="p-3 border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-600 bg-blue-50 dark:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                     <Car className="h-5 w-5 mr-2 text-gray-500" />
                    {vistoria.placa} - {vistoria.modelo}
                    <span className="ml-auto px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Entrada
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Cliente: <span 
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = vistoria.locacao_id 
                          ? `/checklist/editar/${vistoria.id}?locacaoId=${vistoria.locacao_id}&tipo=${vistoria.tipo_vistoria}`
                          : `/checklist/editar/${vistoria.id}?tipo=${vistoria.tipo_vistoria}`;
                        navigate(url);
                      }}
                    >
                      {vistoria.nome_condutor}
                    </span>
                  </div>
                   <div className="text-xs mt-2 font-semibold text-blue-600 dark:text-blue-400">
                    Clique para preencher a vistoria de entrada (dados da saída serão carregados)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma vistoria de entrada pendente.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                As vistorias de entrada aparecem aqui automaticamente após finalizar uma vistoria de saída.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nova Vistoria de Saída */}
      <div className="mb-8">
        <div className="bg-orange-50 dark:bg-gray-700 p-6 rounded-lg border border-orange-200 dark:border-orange-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Nova Vistoria de Saída</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Use para registrar a saída de um veículo da sua frota para um cliente.</p>
          <button 
            onClick={() => navigate('/checklist/novo?tipo=saida')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg w-full transition-transform transform hover:scale-105"
          >
            <PlusCircle className="mr-3 h-6 w-6" />
            Nova Vistoria de Saída
          </button>
        </div>
      </div>

      {/* Seção de Consulta */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Consultar Vistorias Realizadas
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar vistorias por placa, modelo ou condutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Histórico de Vistorias
        </h3>
        <div className="bg-yellow-50 dark:bg-gray-700 rounded-lg p-6 border border-yellow-200 dark:border-yellow-600">
          <p className="text-gray-800 dark:text-gray-200">
            Histórico de Vistorias temporariamente desativado até finalizar as vistorias em andamento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChecklistDashboard;
