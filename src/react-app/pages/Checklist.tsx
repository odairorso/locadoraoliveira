import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Car, 
  User, 
  CheckCircle2, 
  XCircle, 
  Save,
  Search
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  celular: string;
}

interface Veiculo {
  id: number;
  modelo: string;
  marca: string;
  placa: string;
  cor: string;
}

interface Locacao {
  id: number;
  cliente_id: number;
  veiculo_id: number;
  data_locacao: string;
  data_entrega: string;
  status: string;
  clientes?: {
    nome: string;
    cpf: string;
    celular: string;
  };
  veiculos?: {
    marca: string;
    modelo: string;
    placa: string;
    cor: string;
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  status: 'ok' | 'problema' | null;
  observacao?: string;
}

interface FormData {
  cliente_id: number | null;
  veiculo_id: number | null;
  locacao_id: number | null;
  nome_condutor: string;
  quilometragem: string;
  combustivel: string;
  observacoes: string;
  checklist: ChecklistItem[];
  tipo_vistoria: 'entrada' | 'saida';
  assinatura: string;
}

const checklistItems: ChecklistItem[] = [
  { id: 'pneus', label: 'Pneus', status: null },
  { id: 'rodas', label: 'Rodas', status: null },
  { id: 'para_choque_dianteiro', label: 'Para-choque Dianteiro', status: null },
  { id: 'para_choque_traseiro', label: 'Para-choque Traseiro', status: null },
  { id: 'lateral_direita', label: 'Lateral Direita', status: null },
  { id: 'lateral_esquerda', label: 'Lateral Esquerda', status: null },
  { id: 'teto', label: 'Teto', status: null },
  { id: 'capo', label: 'Capô', status: null },
  { id: 'porta_malas', label: 'Porta-malas', status: null },
  { id: 'farol_dianteiro', label: 'Farol Dianteiro', status: null },
  { id: 'farol_traseiro', label: 'Farol Traseiro', status: null },
  { id: 'retrovisor_direito', label: 'Retrovisor Direito', status: null },
  { id: 'retrovisor_esquerdo', label: 'Retrovisor Esquerdo', status: null },
  { id: 'para_brisa', label: 'Para-brisa', status: null },
  { id: 'vidro_traseiro', label: 'Vidro Traseiro', status: null },
  { id: 'vidros_laterais', label: 'Vidros Laterais', status: null },
  { id: 'interior', label: 'Interior', status: null },
  { id: 'documentos', label: 'Documentos', status: null },
  { id: 'triangulo', label: 'Triângulo', status: null },
  { id: 'macaco', label: 'Macaco', status: null },
  { id: 'chave_roda', label: 'Chave de Roda', status: null },
  { id: 'estepe', label: 'Estepe', status: null },
];

export default function Checklist() {
  const [searchParams] = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [selectedLocacao, setSelectedLocacao] = useState<Locacao | null>(null);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchVeiculo, setSearchVeiculo] = useState('');
  const [showLocacaoSelection, setShowLocacaoSelection] = useState(true);
  const [form, setForm] = useState<FormData>({
    cliente_id: null,
    veiculo_id: null,
    locacao_id: null,
    nome_condutor: '',
    quilometragem: '',
    combustivel: '',
    observacoes: '',
    checklist: checklistItems,
    tipo_vistoria: 'entrada',
    assinatura: ''
  });
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    carregarClientes();
    carregarVeiculos();
    carregarLocacoes();

    // Verificar se há parâmetros de URL para vistoria de saída
    const entradaId = searchParams.get('entrada_id');
    const veiculoId = searchParams.get('veiculo_id');
    const locacaoId = searchParams.get('locacaoId');
    const tipoVistoria = searchParams.get('tipo');

    if (entradaId && veiculoId && tipoVistoria === 'saida') {
      setForm(prev => ({ ...prev, tipo_vistoria: 'saida' }));
      carregarDadosVistoriaEntrada(entradaId, veiculoId);
    } else if (locacaoId) {
      setForm(prev => ({ ...prev, tipo_vistoria: 'saida' }));
      carregarDadosVistoriaPorLocacao(locacaoId);
    }
  }, [searchParams]);

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const result = await response.json();
      
      if (result.success && result.data) {
        setClientes(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarVeiculos = async () => {
    try {
      const response = await fetch('/api/veiculos');
      const result = await response.json();
      
      if (result.success && result.data) {
        setVeiculos(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    }
  };

  const carregarLocacoes = async () => {
    try {
      const response = await fetch('/api/locacoes');
      const result = await response.json();
      
      if (result.success && result.data) {
        setLocacoes(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar locações:', error);
    }
  };

  const carregarDadosVistoriaEntrada = async (entradaId: string, veiculoId: string) => {
    try {
      console.log('carregarDadosVistoriaEntrada - Iniciando com entradaId:', entradaId, 'veiculoId:', veiculoId);
      
      // Buscar dados da vistoria de entrada
      const vistoriaResponse = await fetch(`/api/vistorias/${entradaId}`);
      const vistoriaResult = await vistoriaResponse.json();
      
      console.log('Resposta da vistoria:', vistoriaResult);
      
      if (vistoriaResult.success && vistoriaResult.data) {
        const vistoriaEntrada = vistoriaResult.data;
        console.log('Dados da vistoria de entrada:', vistoriaEntrada);
        
        // Buscar dados do veículo
        const veiculoResponse = await fetch(`/api/veiculos/${veiculoId}`);
        const veiculoResult = await veiculoResponse.json();
        
        console.log('Resposta do veículo:', veiculoResult);
        
        if (veiculoResult.success && veiculoResult.data) {
          const veiculo = veiculoResult.data;
          console.log('Dados do veículo:', veiculo);
          setSelectedVeiculo(veiculo);
          
          // Buscar dados do cliente
          const clienteResponse = await fetch(`/api/clientes/${vistoriaEntrada.cliente_id}`);
          const clienteResult = await clienteResponse.json();
          
          console.log('Resposta do cliente:', clienteResult);
          
          if (clienteResult.success && clienteResult.data) {
            const cliente = clienteResult.data;
            console.log('Dados do cliente:', cliente);
            setSelectedCliente(cliente);
            
            // Preencher o formulário com os dados
            setForm(prev => ({
              ...prev,
              veiculo_id: parseInt(veiculoId),
              cliente_id: vistoriaEntrada.cliente_id,
              locacao_id: vistoriaEntrada.locacao_id,
              nome_condutor: cliente.nome
            }));
            
            console.log('Formulário preenchido, ocultando seleção de locação');
            // Não mostrar seleção de locação pois já temos os dados
            setShowLocacaoSelection(false);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da vistoria de entrada:', error);
      // Em caso de erro, mostrar seleção manual
      setShowLocacaoSelection(true);
    }
  };

  const carregarDadosVistoriaPorLocacao = async (locacaoId: string) => {
    try {
      console.log('carregarDadosVistoriaPorLocacao - Iniciando com locacaoId:', locacaoId);
      
      // Buscar dados da locação
      const locacaoResponse = await fetch(`/api/locacoes/${locacaoId}`);
      const locacaoResult = await locacaoResponse.json();
      
      console.log('Resposta da locação:', locacaoResult);
      
      if (locacaoResult.success && locacaoResult.data) {
        const locacao = locacaoResult.data;
        console.log('Dados da locação:', locacao);
        
        // Buscar vistoria de entrada pelo veículo da locação
        const vistoriasResponse = await fetch(`/api/vistorias?veiculo_id=${locacao.veiculo_id}&tipo=entrada`);
        const vistoriasResult = await vistoriasResponse.json();
        
        console.log('Resposta das vistorias:', vistoriasResult);
        
        if (vistoriasResult.success && vistoriasResult.data && vistoriasResult.data.vistorias && vistoriasResult.data.vistorias.length > 0) {
          const vistoriaEntrada = vistoriasResult.data.vistorias[0];
          console.log('Vistoria de entrada encontrada:', vistoriaEntrada);
          
          // Definir cliente e veículo selecionados
          if (locacao.clientes) {
            setSelectedCliente({
              id: locacao.cliente_id,
              nome: locacao.clientes.nome,
              cpf: locacao.clientes.cpf,
              celular: locacao.clientes.celular || ''
            });
          }
          
          if (locacao.veiculos) {
            setSelectedVeiculo({
              id: locacao.veiculo_id,
              modelo: locacao.veiculos.modelo,
              marca: locacao.veiculos.marca,
              placa: locacao.veiculos.placa,
              cor: locacao.veiculos.cor
            });
          }
          
          setSelectedLocacao(locacao);
          
          // Preencher o formulário com os dados
          setForm(prev => ({
            ...prev,
            veiculo_id: locacao.veiculo_id,
            cliente_id: locacao.cliente_id,
            locacao_id: parseInt(locacaoId),
            nome_condutor: locacao.clientes?.nome || '',
            quilometragem: vistoriaEntrada.quilometragem || '',
            combustivel: vistoriaEntrada.combustivel || ''
          }));
          
          console.log('Formulário preenchido com dados da locação, ocultando seleção de locação');
          // Não mostrar seleção de locação pois já temos os dados
          setShowLocacaoSelection(false);
        } else {
          console.log('Nenhuma vistoria de entrada encontrada para o veículo da locação');
          alert(`Vistoria de entrada não encontrada para o veículo ${locacao.veiculos?.marca} ${locacao.veiculos?.modelo} - ${locacao.veiculos?.placa}. Você precisará preencher os dados manualmente.`);
          
          // Mesmo sem vistoria de entrada, podemos preencher os dados básicos da locação
          if (locacao.clientes) {
            setSelectedCliente({
              id: locacao.cliente_id,
              nome: locacao.clientes.nome,
              cpf: locacao.clientes.cpf,
              celular: locacao.clientes.celular || ''
            });
          }
          
          if (locacao.veiculos) {
            setSelectedVeiculo({
              id: locacao.veiculo_id,
              modelo: locacao.veiculos.modelo,
              marca: locacao.veiculos.marca,
              placa: locacao.veiculos.placa,
              cor: locacao.veiculos.cor
            });
          }
          
          setSelectedLocacao(locacao);
          
          // Preencher o formulário com os dados básicos
          setForm(prev => ({
            ...prev,
            veiculo_id: locacao.veiculo_id,
            cliente_id: locacao.cliente_id,
            locacao_id: parseInt(locacaoId),
            nome_condutor: locacao.clientes?.nome || ''
          }));
          
          // Ocultar seleção de locação mesmo sem vistoria de entrada
          setShowLocacaoSelection(false);
        }
      } else {
        console.log('Locação não encontrada');
        alert('Locação não encontrada.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados da vistoria por locação:', error);
      alert('Erro ao carregar dados da locação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      // Em caso de erro, mostrar seleção manual
      setShowLocacaoSelection(true);
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setForm({ ...form, cliente_id: cliente.id, nome_condutor: cliente.nome });
    setSearchCliente('');
  };

  const handleSelectVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setForm({ ...form, veiculo_id: veiculo.id });
    setSearchVeiculo('');
    
    const locacaoAtiva = locacoes.find((l: Locacao) => l.veiculo_id === veiculo.id);
    if (locacaoAtiva) {
      setSelectedLocacao(locacaoAtiva);
      setForm({ ...form, veiculo_id: veiculo.id, locacao_id: locacaoAtiva.id });
    }
  };

  const selecionarLocacao = (locacao: Locacao) => {
    setSelectedLocacao(locacao);
    setForm(prev => ({ ...prev, locacao_id: locacao.id }));
    
    // Buscar dados do cliente e veículo da locação
    const cliente = clientes.find(c => c.id === locacao.cliente_id);
    const veiculo = veiculos.find(v => v.id === locacao.veiculo_id);
    
    if (cliente) {
      setSelectedCliente(cliente);
      setForm(prev => ({ ...prev, cliente_id: cliente.id, nome_condutor: cliente.nome }));
    }
    
    if (veiculo) {
      setSelectedVeiculo(veiculo);
      setForm(prev => ({ ...prev, veiculo_id: veiculo.id }));
    }
    
    setShowLocacaoSelection(false);
  };

  const updateChecklistItem = (id: string, status: 'ok' | 'problema', observacao?: string) => {
    setForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id ? { ...item, status, observacao } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Capturar assinatura
      const assinatura = signatureRef.current?.toDataURL() || '';
      
      const vistoriaData = {
        ...form,
        assinatura,
        data_vistoria: new Date().toISOString()
      };

      const response = await fetch('/api/vistorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vistoriaData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Vistoria salva com sucesso!');
        // Reset form
        setForm({
          cliente_id: null,
          veiculo_id: null,
          locacao_id: null,
          nome_condutor: '',
          quilometragem: '',
          combustivel: '',
          observacoes: '',
          checklist: checklistItems,
          tipo_vistoria: 'entrada',
          assinatura: ''
        });
        setSelectedCliente(null);
        setSelectedVeiculo(null);
        setSelectedLocacao(null);
        signatureRef.current?.clear();
      } else {
        throw new Error(result.message || 'Erro ao salvar vistoria');
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar vistoria:', error);
      alert('Erro ao salvar vistoria: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
    c.cpf.includes(searchCliente)
  );

  const veiculosFiltrados = veiculos.filter(v => 
    v.modelo.toLowerCase().includes(searchVeiculo.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchVeiculo.toLowerCase()) ||
    v.placa.toLowerCase().includes(searchVeiculo.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Check List de Vistoria
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Registre as condições do veículo na entrada ou saída
        </p>
      </div>

      {/* Seleção de Locação para Vistoria de Saída */}
      {showLocacaoSelection && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Selecione a Locação para Vistoria de Saída
          </h2>
          <div className="space-y-3">
            {locacoes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma locação ativa encontrada
              </p>
            ) : (
              locacoes.map((locacao) => {
                const cliente = clientes.find(c => c.id === locacao.cliente_id);
                const veiculo = veiculos.find(v => v.id === locacao.veiculo_id);
                
                return (
                  <div
                    key={locacao.id}
                    onClick={() => selecionarLocacao(locacao)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {cliente?.nome || 'Cliente não encontrado'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {veiculo ? `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}` : 'Veículo não encontrado'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Locação #{locacao.id} - {new Date(locacao.data_locacao).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativa
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tipo de Vistoria */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Tipo de Vistoria
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setForm({ ...form, tipo_vistoria: 'entrada' })}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              form.tipo_vistoria === 'entrada'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Vistoria de Entrada
          </button>
          <button
            onClick={() => setForm({ ...form, tipo_vistoria: 'saida' })}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              form.tipo_vistoria === 'saida'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Vistoria de Saída
          </button>
        </div>
      </div>

      {/* Seleção de Cliente */}
      {!showLocacaoSelection && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="mr-2" size={24} />
          Cliente
        </h2>
        
        {!selectedCliente ? (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou CPF..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {searchCliente && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{cliente.nome}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{cliente.cpf} • {cliente.celular}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{selectedCliente.nome}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedCliente.cpf}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedCliente.celular}</div>
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Seleção de Veículo */}
      {!showLocacaoSelection && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Car className="mr-2" size={24} />
          Veículos
        </h2>
        
        {!selectedVeiculo ? (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar veículo por marca, modelo ou placa..."
                value={searchVeiculo}
                onChange={(e) => setSearchVeiculo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {searchVeiculo && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {veiculosFiltrados.length > 0 ? (
                  veiculosFiltrados.map(veiculo => (
                    <button
                      key={veiculo.id}
                      onClick={() => handleSelectVeiculo(veiculo)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{veiculo.marca} {veiculo.modelo}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{veiculo.placa} • {veiculo.cor}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    Nenhum veículo encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{selectedVeiculo.marca} {selectedVeiculo.modelo}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedVeiculo.placa}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cor: {selectedVeiculo.cor}</div>
              </div>
              <button
                onClick={() => setSelectedVeiculo(null)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Dados da Locação Selecionada */}
      {selectedLocacao && form.tipo_vistoria === 'saida' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dados da Locação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {selectedCliente?.nome}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Veículo
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {selectedVeiculo ? `${selectedVeiculo.marca} ${selectedVeiculo.modelo} - ${selectedVeiculo.placa}` : ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data da Locação
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(selectedLocacao.data_locacao).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Entrega
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(selectedLocacao.data_entrega).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Vistoria */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Veículo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dados do Veículo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quilometragem
              </label>
              <input
                type="text"
                value={form.quilometragem}
                onChange={(e) => setForm({ ...form, quilometragem: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: 50000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nível de Combustível
              </label>
              <select
                value={form.combustivel}
                onChange={(e) => setForm({ ...form, combustivel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="vazio">Vazio</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="cheio">Cheio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dados do Condutor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dados do Condutor
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Condutor
            </label>
            <input
              type="text"
              value={form.nome_condutor}
              onChange={(e) => setForm({ ...form, nome_condutor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nome completo"
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Checklist do Veículo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {form.checklist.map(item => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{item.label}</h3>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => updateChecklistItem(item.id, 'ok')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      item.status === 'ok'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <CheckCircle2 className="inline mr-1" size={16} />
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => updateChecklistItem(item.id, 'problema')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      item.status === 'problema'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <XCircle className="inline mr-1" size={16} />
                    Problema
                  </button>
                </div>
                {item.status === 'problema' && (
                  <textarea
                    placeholder="Descreva o problema..."
                    value={item.observacao || ''}
                    onChange={(e) => updateChecklistItem(item.id, 'problema', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Observações
          </h2>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Observações adicionais sobre o veículo..."
          />
        </div>

        {/* Assinatura */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Assinatura
          </h2>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-40 bg-white dark:bg-gray-700'
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => signatureRef.current?.clear()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Limpar Assinatura
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !selectedCliente || !selectedVeiculo}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Vistoria'}
          </button>
        </div>
      </form>
    </div>
  );
}