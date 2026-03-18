import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface VistoriaData {
  id: string;
  tipo_vistoria: 'entrada' | 'saida';
  quilometragem: number;
  nivel_combustivel: string;
  nome_condutor: string;
  created_at: string;
  clientes?: {
    nome: string;
    cpf_cnpj: string;
    telefone: string;
  };
  veiculos?: {
    placa: string;
    modelo: string;
    marca: string;
    cor: string;
  };
  checklist?: Record<string, boolean>;
  avarias?: any[];
  fotos?: any[];
  observacoes?: string;
}

const checklistItems = [
  'Calota', 'Pneus (estado geral)', 'Antena', 'Bateria', 'Estepe', 'Macaco',
  'Chave de Roda', 'Triângulo', 'Extintor', 'Tapetes', 'Som/Sistema de áudio',
  'Documentos do veículo', 'Veículo higienizado'
];

const uiToDbChecklistMap: Record<string, string> = {
  'Calota': 'calota',
  'Pneus (estado geral)': 'pneu',
  'Antena': 'antena',
  'Bateria': 'bateria',
  'Estepe': 'estepe',
  'Macaco': 'macaco',
  'Chave de Roda': 'chave_roda',
  'Triângulo': 'triangulo',
  'Extintor': 'extintor',
  'Tapetes': 'tapetes',
  'Som/Sistema de áudio': 'som',
  'Documentos do veículo': 'documentos',
  'Veículo higienizado': 'higienizacao',
};

const VistoriaComparacao: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const saidaId = searchParams.get('saida_id');

  const [vistoriaEntrada, setVistoriaEntrada] = useState<VistoriaData | null>(null);
  const [vistoriaSaida, setVistoriaSaida] = useState<VistoriaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confrontoState, setConfrontoState] = useState<Record<string, boolean>>({});
  const [observacoesConfronto, setObservacoesConfronto] = useState('');
  const [saving, setSaving] = useState(false);

  // Carregar dados das vistorias
  useEffect(() => {
    const carregarVistorias = async () => {
      if (!id || !saidaId) {
        alert('IDs das vistorias não fornecidos');
        navigate('/checklist');
        return;
      }

      try {
        // Carregar vistoria de entrada
        const entradaResponse = await fetch(`/api/vistorias/${id}`);
        const entradaResult = await entradaResponse.json();

        if (entradaResult.success && entradaResult.data) {
          setVistoriaEntrada(entradaResult.data);
        }

        // Carregar vistoria de saída
        const saidaResponse = await fetch(`/api/vistorias/${saidaId}`);
        const saidaResult = await saidaResponse.json();

        if (saidaResult.success && saidaResult.data) {
          setVistoriaSaida(saidaResult.data);
        }

        // Inicializar o estado de confronto com base nos dados das vistorias
        if (entradaResult.success && entradaResult.data && saidaResult.success && saidaResult.data) {
          const initialConfrontoState: Record<string, boolean> = {};
          checklistItems.forEach(item => {
            // Marcar como confrontado se os valores forem iguais
            const dbKey = uiToDbChecklistMap[item] || item.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/\s*\([^)]*\)\s*/g, '')
              .replace(/[\s\/]/g, '_')
              .replace(/_$/, '');

            const saidaStatus = saidaResult.data.checklist ? !!saidaResult.data.checklist[dbKey] : false;
            const entradaStatus = entradaResult.data.checklist ? !!entradaResult.data.checklist[dbKey] : false;

            // Marcar como confrontado automaticamente se os valores forem iguais
            initialConfrontoState[item] = saidaStatus === entradaStatus;
          });
          setConfrontoState(initialConfrontoState);
        }

      } catch (error) {
        console.error('Erro ao carregar vistorias:', error);
        alert('Erro ao carregar dados das vistorias');
      } finally {
        setLoading(false);
      }
    };

    carregarVistorias();
  }, [id, saidaId, navigate]);

  const handleConfrontoChange = (item: string) => {
    setConfrontoState(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleFinalizarConfronto = async () => {
    if (!vistoriaEntrada) return;

    setSaving(true);
    try {
      // Preparar dados do checklist para salvar
      const checklistData: Record<string, boolean> = {};
      Object.keys(confrontoState).forEach(key => {
        const dbKey = uiToDbChecklistMap[key] || key.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s*\([^)]*\)\s*/g, '')
          .replace(/[\s\/]/g, '_')
          .replace(/_$/, '');
        checklistData[dbKey] = confrontoState[key];
      });

      // Atualizar vistoria de entrada com os dados do confronto
      const payload = {
        checklist: checklistData,
        confronto: confrontoState,
        observacoes_confronto: observacoesConfronto,
        nomeVistoriador: 'Sistema' // Marcar como finalizada pelo sistema
      };

      const response = await fetch(`/api/vistorias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Tentar finalizar a locação
        try {
          const finalizarResponse = await fetch('/api/finalizar-locacao-vistoria', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vistoria_id: id }),
          });

          const finalizarResult = await finalizarResponse.json();
          if (finalizarResult.success) {
            alert('Confronto de vistoria finalizado e locação finalizada com sucesso!');
          } else {
            alert(`Confronto de vistoria finalizado, mas houve um erro ao finalizar a locação: ${finalizarResult.error}`);
          }
        } catch (error) {
          console.error('Erro ao finalizar locação:', error);
          alert('Confronto de vistoria finalizado, mas houve um erro ao finalizar a locação.');
        }

        navigate('/checklist');
      } else {
        throw new Error(result.message || 'Erro ao finalizar confronto');
      }
    } catch (error) {
      console.error('Erro ao finalizar confronto:', error);
      alert('Erro ao finalizar confronto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle2 size={20} /> : <XCircle size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando dados das vistorias...</span>
      </div>
    );
  }

  if (!vistoriaEntrada || !vistoriaSaida) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Não foi possível carregar os dados das vistorias</p>
          <button
            onClick={() => navigate('/checklist')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/checklist')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Confronto de Vistoria
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {vistoriaSaida.veiculos?.marca} {vistoriaSaida.veiculos?.modelo} - {vistoriaSaida.veiculos?.placa}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Cliente: {vistoriaSaida.clientes?.nome}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Vistoria de Saída: {new Date(vistoriaSaida.created_at).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Vistoria de Entrada: {new Date(vistoriaEntrada.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Dados Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Vistoria de Saída
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Quilometragem:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaSaida.quilometragem} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Combustível:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaSaida.nivel_combustivel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Condutor:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaSaida.nome_condutor}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Vistoria de Entrada
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Quilometragem:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaEntrada.quilometragem} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Combustível:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaEntrada.nivel_combustivel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Condutor:</span>
                <span className="font-medium text-gray-900 dark:text-white">{vistoriaEntrada.nome_condutor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Confronto */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Checklist de Confronto
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Item</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Saída</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Entrada</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Confrontado</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map(item => {
                  // Obter a chave do banco de dados mapeada para este item
                  const dbKey = uiToDbChecklistMap[item] || item.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s*\([^)]*\)\s*/g, '')
                    .replace(/[\s\/]/g, '_')
                    .replace(/_$/, '');

                  const saidaStatus = vistoriaSaida.checklist ? !!vistoriaSaida.checklist[dbKey] : false;
                  const entradaStatus = vistoriaEntrada.checklist ? !!vistoriaEntrada.checklist[dbKey] : false;
                  const confrontado = !!confrontoState[item];

                  return (
                    <tr key={item} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">{item}</td>
                      <td className="p-3 text-center">
                        <div className={`flex items-center justify-center ${getStatusColor(saidaStatus)}`}>
                          {getStatusIcon(saidaStatus)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`flex items-center justify-center ${getStatusColor(entradaStatus)}`}>
                          {getStatusIcon(entradaStatus)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={confrontado}
                            onChange={() => handleConfrontoChange(item)}
                            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observações do Confronto */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Observações do Confronto
          </h2>
          <textarea
            value={observacoesConfronto}
            onChange={(e) => setObservacoesConfronto(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Descreva aqui quaisquer diferenças ou observações sobre o confronto das vistorias..."
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/checklist')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalizarConfronto}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} className="mr-2" />
                Finalizar Confronto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VistoriaComparacao;
