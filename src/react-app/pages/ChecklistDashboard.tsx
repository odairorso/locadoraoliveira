import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Car, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChecklistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vistoriasPendentes, setVistoriasPendentes] = useState<any[]>([]);
  const [vistoriasRealizadas, setVistoriasRealizadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarVistorias();
  }, []);

  const carregarVistorias = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/vistorias');
      const result = await response.json();
      
      if (result.success && result.data.vistorias) {
        const todasVistorias = result.data.vistorias;
        
        // Separa as vistorias em pendentes e realizadas
        const pendentes = todasVistorias.filter((v: { nome_vistoriador: string, tipo_vistoria: string }) => v.nome_vistoriador === 'Sistema' && v.tipo_vistoria === 'saida');
        const realizadas = todasVistorias.filter((v: { nome_vistoriador: string }) => v.nome_vistoriador !== 'Sistema');

        setVistoriasPendentes(pendentes);
        setVistoriasRealizadas(realizadas);
      }
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const vistoriasFiltradas = vistoriasRealizadas.filter(vistoria =>
    vistoria.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vistoria.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vistoria.nome_condutor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Check List de Vistoria
      </h1>

      {/* Seção de Ações e Vistorias Pendentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Vistorias de Saída Pendentes */}
        <div className="bg-orange-50 dark:bg-gray-700 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Clock className="mr-3 h-6 w-6 text-orange-500" />
            Vistorias de Saída Pendentes
          </h2>
          {loading ? (
             <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
             </div>
          ) : vistoriasPendentes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {vistoriasPendentes.map((vistoria) => (
                <div
                  key={vistoria.id}
                  onClick={() => {
                    // Constrói a URL para a página de 'novo' checklist, passando os dados da vistoria pendente
                    const params = new URLSearchParams();
                    params.set('tipo', 'saida');
                    params.set('locacaoId', vistoria.locacao_id); // Assumindo que a API retorna locacao_id
                    navigate(`/checklist/novo?${params.toString()}`);
                  }}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                     <Car className="h-5 w-5 mr-2 text-gray-500" />
                    {vistoria.placa} - {vistoria.modelo}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Cliente: {vistoria.nome_condutor}
                  </div>
                   <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-semibold">
                    Clique para preencher e finalizar a vistoria
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center p-4">Nenhuma vistoria de saída pendente.</p>
          )}
        </div>

        {/* Nova Vistoria de Entrada */}
        <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Vistoria de Entrada</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Use para registrar a entrada de um veículo de um cliente na sua frota.</p>
          <button 
            onClick={() => navigate('/checklist/novo?tipo=entrada')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-lg w-full transition-transform transform hover:scale-105"
          >
            <PlusCircle className="mr-3 h-6 w-6" />
            Nova Vistoria de Entrada
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
        {loading ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Carregando histórico...
            </p>
          </div>
        ) : vistoriasFiltradas.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm ? 'Nenhuma vistoria encontrada para a busca.' : 'Nenhum histórico de vistoria encontrado.'}
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
    </div>
  );
};

export default ChecklistDashboard;
