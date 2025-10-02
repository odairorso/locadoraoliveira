import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, X, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const ChecklistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false);
  const [veiculosComEntrada, setVeiculosComEntrada] = useState<any[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);

  useEffect(() => {
    carregarVistorias();
  }, []);

  const carregarVistorias = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/vistorias');
      const result = await response.json();
      
      if (result.success && result.data.vistorias) {
        setVistorias(result.data.vistorias);
      }
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const vistoriasFiltradas = vistorias.filter(vistoria =>
    vistoria.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vistoria.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vistoria.nome_condutor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };



  const carregarVeiculosComEntrada = async () => {
    console.log('carregarVeiculosComEntrada iniciado');
    setLoadingVeiculos(true);
    try {
      const response = await fetch('http://localhost:3000/api/vistorias?veiculos_com_entrada=true');
      const result = await response.json();
      console.log('Resposta da API:', result);
      
      if (result.success && result.data) {
        console.log('Veículos com entrada encontrados:', result.data);
        setVeiculosComEntrada(result.data);
      } else {
        console.error('Erro ao carregar veículos com entrada:', result.error);
        setVeiculosComEntrada([]);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos com entrada:', error);
      setVeiculosComEntrada([]);
    } finally {
      setLoadingVeiculos(false);
    }
  };

  const handleNovaVistoriaSaida = () => {
    setShowVehicleSelectionModal(true);
    carregarVeiculosComEntrada();
  };

  const handleSelecionarVeiculo = (vistoriaEntrada: any) => {
    navigate(`/checklist/novo?tipo=saida&veiculo_id=${vistoriaEntrada.veiculo_id}&entrada_id=${vistoriaEntrada.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Check List de Vistoria
      </h1>

      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/checklist/novo?tipo=entrada')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center text-lg transition-transform transform hover:scale-105"
        >
          <PlusCircle className="mr-3 h-6 w-6" />
          Nova Vistoria de Entrada
        </button>
        <button 
          onClick={handleNovaVistoriaSaida}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center text-lg transition-transform transform hover:scale-105"
        >
          <PlusCircle className="mr-3 h-6 w-6" />
          Nova Vistoria de Saída
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Consultar Vistorias
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
          Últimas Vistorias Realizadas
        </h3>
        {loading ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Carregando vistorias...
            </p>
          </div>
        ) : vistoriasFiltradas.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm ? 'Nenhuma vistoria encontrada para a busca.' : 'Nenhuma vistoria encontrada.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vistoriasFiltradas.map((vistoria) => (
              <div key={vistoria.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        vistoria.tipo_vistoria === 'entrada' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {vistoria.tipo_vistoria === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <h3 
                        className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => navigate(`/checklist/visualizar/${vistoria.id}`)}
                      >
                        {vistoria.placa} - {vistoria.modelo}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="font-medium">Condutor:</span> 
                        <span 
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
                          onClick={() => navigate(`/checklist/visualizar/${vistoria.id}`)}
                        >
                          {vistoria.nome_condutor}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Quilometragem:</span> {vistoria.quilometragem?.toLocaleString()} km
                      </div>
                      <div>
                        <span className="font-medium">Data:</span> {formatarData(vistoria.created_at)}
                      </div>
                </div>
              </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Seleção de Veículos para Vistoria de Saída */}
      {showVehicleSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Selecionar Veículo para Vistoria de Saída
              </h2>
              <button
                onClick={() => setShowVehicleSelectionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingVeiculos ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando veículos...</span>
              </div>
            ) : veiculosComEntrada.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {veiculosComEntrada.map((vistoria) => (
                  <div
                    key={vistoria.id}
                    onClick={() => handleSelecionarVeiculo(vistoria)}
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center mb-2">
                      <Car className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {vistoria.placa} - {vistoria.modelo}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Cliente: {vistoria.cliente_nome}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Condutor: {vistoria.condutor}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Entrada: {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Clique para fazer vistoria de saída
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum veículo com vistoria de entrada encontrado</p>
                <p className="text-sm mt-2">Faça primeiro uma vistoria de entrada para poder fazer a saída</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVehicleSelectionModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistDashboard;

