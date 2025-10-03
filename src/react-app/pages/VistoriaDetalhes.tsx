import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface VistoriaDetalhes {
  id: number;
  tipo_vistoria: 'entrada' | 'saida';
  placa: string;
  modelo: string;
  cor: string;
  nome_condutor: string;
  rg_condutor: string;
  quilometragem: number;
  nivel_combustivel: string;
  observacoes: string;
  avarias: string;
  fotos: string; // JSON string containing photos array
  created_at: string;
  clientes: { nome: string; cpf: string };
  veiculos: { marca: string; modelo: string; placa: string };
  // Checklist items
  item_calota: boolean;
  item_pneu: boolean;
  item_antena: boolean;
  item_bateria: boolean;
  item_estepe: boolean;
  item_macaco: boolean;
  item_chave_roda: boolean;
  item_triangulo: boolean;
  item_extintor: boolean;
  item_tapetes: boolean;
  item_som: boolean;
  item_documentos: boolean;
  item_higienizacao: boolean;
}

const VistoriaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState<VistoriaDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      carregarVistoria();
    }
  }, [id]);

  const carregarVistoria = async () => {
    try {
      const response = await fetch(`/api/vistorias/${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setVistoria(result.data);
      } else {
        console.error('Vistoria não encontrada:', result.error);
        setVistoria(null);
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria:', error);
      setVistoria(null);
    } finally {
      setLoading(false);
    }
  };

  const excluirVistoria = async () => {
    try {
      const response = await fetch(`/api/vistorias/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        navigate('/checklist');
      } else {
        alert('Erro ao excluir vistoria: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir vistoria:', error);
      alert('Erro ao excluir vistoria');
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const itensChecklist = [
    { key: 'item_calota', label: 'Calota' },
    { key: 'item_pneu', label: 'Pneu' },
    { key: 'item_antena', label: 'Antena' },
    { key: 'item_bateria', label: 'Bateria' },
    { key: 'item_estepe', label: 'Estepe' },
    { key: 'item_macaco', label: 'Macaco' },
    { key: 'item_chave_roda', label: 'Chave de Roda' },
    { key: 'item_triangulo', label: 'Triângulo' },
    { key: 'item_extintor', label: 'Extintor' },
    { key: 'item_tapetes', label: 'Tapetes' },
    { key: 'item_som', label: 'Som' },
    { key: 'item_documentos', label: 'Documentos' },
    { key: 'item_higienizacao', label: 'Higienização' },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Carregando detalhes da vistoria...
          </p>
        </div>
      </div>
    );
  }

  if (!vistoria) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-500 text-lg">Vistoria não encontrada</p>
          <button
            onClick={() => navigate('/checklist')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/checklist')}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalhes da Vistoria
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              vistoria.tipo_vistoria === 'entrada' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {vistoria.tipo_vistoria === 'entrada' ? 'Vistoria de Entrada' : 'Vistoria de Saída'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/checklist/editar/${vistoria.id}`)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Informações Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações do Veículo
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Placa:</span> {vistoria.placa}</div>
            <div><span className="font-medium">Modelo:</span> {vistoria.modelo}</div>
            <div><span className="font-medium">Cor:</span> {vistoria.cor}</div>
            <div><span className="font-medium">Quilometragem:</span> {vistoria.quilometragem?.toLocaleString()} km</div>
            <div><span className="font-medium">Nível Combustível:</span> {vistoria.nivel_combustivel}</div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações do Condutor
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Nome:</span> {vistoria.nome_condutor}</div>
            <div><span className="font-medium">RG:</span> {vistoria.rg_condutor}</div>
            <div><span className="font-medium">Cliente:</span> {vistoria.clientes?.nome}</div>
            <div><span className="font-medium">CPF:</span> {vistoria.clientes?.cpf}</div>
            <div><span className="font-medium">Data:</span> {formatarData(vistoria.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Checklist de Itens
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itensChecklist.map((item) => {
            const valor = vistoria[item.key as keyof VistoriaDetalhes] as boolean;
            return (
              <div key={item.key} className="flex items-center gap-2">
                {valor ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fotos */}
      {vistoria.fotos && (() => {
        try {
          const fotosArray = JSON.parse(vistoria.fotos);
          if (fotosArray && fotosArray.length > 0) {
            return (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Fotos da Vistoria
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fotosArray.map((foto: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(foto, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          Clique para ampliar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        } catch (error) {
          console.error('Erro ao parsear fotos:', error);
        }
        return null;
      })()}

      {/* Observações e Avarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vistoria.observacoes && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observações
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {vistoria.observacoes}
            </p>
          </div>
        )}

        {vistoria.avarias && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Avarias
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {(() => {
                try {
                  // Se avarias é uma string JSON, parse ela
                  const avariasData = typeof vistoria.avarias === 'string' 
                    ? JSON.parse(vistoria.avarias) 
                    : vistoria.avarias;
                  
                  // Se é um array de avarias
                  if (Array.isArray(avariasData) && avariasData.length > 0) {
                    const avariaLegendas = {
                      'A': 'Amassado',
                      'R': 'Risco',
                      'T': 'Trincado',
                      'Q': 'Quebrado',
                      'F': 'Falta'
                    };
                    
                    return (
                      <div className="space-y-2">
                        {avariasData.map((avaria: any, index: number) => (
                          <div key={avaria.id || index} className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              {avaria.type}
                            </span>
                            <span>
                              {avariaLegendas[avaria.type as keyof typeof avariaLegendas] || avaria.type} 
                              - Posição: ({avaria.x}, {avaria.y})
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return <p>Nenhuma avaria registrada</p>;
                  }
                } catch (error) {
                  // Se não conseguir fazer parse, mostra como string
                  return <p className="whitespace-pre-wrap">{vistoria.avarias}</p>;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={excluirVistoria}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistoriaDetalhes;