import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Car, 
  User, 
  Calendar, 
  Gauge, 
  Fuel, 
  CheckCircle2, 
  XCircle, 
  Save,
  FileText,
  AlertCircle,
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

interface Avaria {
  tipo: 'A' | 'R' | 'T' | 'Q' | 'F';
  localizacao: string;
  descricao: string;
}

interface VistoriaForm {
  tipo_vistoria: 'entrada' | 'saida';
  locacao_id: number | null;
  veiculo_id: number | null;
  cliente_id: number | null;
  quilometragem: number;
  nivel_combustivel: 'vazio' | '1/4' | '1/2' | '3/4' | 'cheio';
  nome_condutor: string;
  rg_condutor: string;
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
  avarias: Avaria[];
  observacoes: string;
  nome_vistoriador: string;
}

export default function CheckListPage() {
  const [searchParams] = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchVeiculo, setSearchVeiculo] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [selectedLocacao, setSelectedLocacao] = useState<Locacao | null>(null);
  const [showLocacaoSelection, setShowLocacaoSelection] = useState(false);

  const sigClienteRef = useRef<SignatureCanvas>(null);
  const sigVistoriadorRef = useRef<SignatureCanvas>(null);

  const [form, setForm] = useState<VistoriaForm>({
    tipo_vistoria: 'entrada',
    locacao_id: null,
    veiculo_id: null,
    cliente_id: null,
    quilometragem: 0,
    nivel_combustivel: 'cheio',
    nome_condutor: '',
    rg_condutor: '',
    item_calota: true,
    item_pneu: true,
    item_antena: true,
    item_bateria: true,
    item_estepe: true,
    item_macaco: true,
    item_chave_roda: true,
    item_triangulo: true,
    item_extintor: true,
    item_tapetes: true,
    item_som: true,
    item_documentos: true,
    item_higienizacao: true,
    avarias: [],
    observacoes: '',
    nome_vistoriador: 'João Roberto'
  });

  const [novaAvaria, setNovaAvaria] = useState<Avaria>({
    tipo: 'A',
    localizacao: '',
    descricao: ''
  });

  useEffect(() => {
    carregarClientes();
    carregarVeiculos();
    carregarLocacoes();
    
    // Detectar tipo de vistoria da URL
    const tipo = searchParams.get('tipo') as 'entrada' | 'saida';
    const veiculoId = searchParams.get('veiculo_id');
    const entradaId = searchParams.get('entrada_id');
    
    console.log('Checklist useEffect - tipo:', tipo);
    console.log('Parâmetros URL - entradaId:', entradaId, 'veiculoId:', veiculoId);
    
    if (tipo) {
      setForm(prev => ({ ...prev, tipo_vistoria: tipo }));
      
      // Se for vistoria de saída com parâmetros, carregar dados automaticamente
      if (tipo === 'saida' && veiculoId && entradaId) {
        console.log('Carregando dados automáticos para vistoria de saída');
        carregarDadosVistoriaEntrada(entradaId, veiculoId);
      } else if (tipo === 'saida') {
        // Se for vistoria de saída sem parâmetros, mostrar seleção de locação
        console.log('Mostrando seleção de locação');
        setShowLocacaoSelection(true);
      }
    }
  }, [searchParams]);

  const carregarClientes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/clientes');
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
      const response = await fetch('http://localhost:3000/api/veiculos');
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
      const response = await fetch('http://localhost:3000/api/locacoes');
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
      const vistoriaResponse = await fetch(`http://localhost:3000/api/vistorias/${entradaId}`);
      const vistoriaResult = await vistoriaResponse.json();
      
      console.log('Resposta da vistoria:', vistoriaResult);
      
      if (vistoriaResult.success && vistoriaResult.data) {
        const vistoriaEntrada = vistoriaResult.data;
        console.log('Dados da vistoria de entrada:', vistoriaEntrada);
        
        // Buscar dados do veículo
        const veiculoResponse = await fetch(`http://localhost:3000/api/veiculos/${veiculoId}`);
        const veiculoResult = await veiculoResponse.json();
        
        console.log('Resposta do veículo:', veiculoResult);
        
        if (veiculoResult.success && veiculoResult.data) {
          const veiculo = veiculoResult.data;
          console.log('Dados do veículo:', veiculo);
          setSelectedVeiculo(veiculo);
          
          // Buscar dados do cliente
          const clienteResponse = await fetch(`http://localhost:3000/api/clientes/${vistoriaEntrada.cliente_id}`);
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

  const carregarLocacoes = async () => {
    try {
      const response = await fetch('/api/locacoes');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Filtrar apenas locações ativas
        const locacoesAtivas = result.data.filter(l => l.status === 'ativa');
        setLocacoes(locacoesAtivas);
      }
    } catch (error) {
      console.error('Erro ao carregar locações:', error);
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
    
    const locacaoAtiva = locacoes.find(l => l.veiculo_id === veiculo.id);
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
      setForm(prev => ({ ...prev, cliente_id: cliente.id }));
    }
    
    if (veiculo) {
      setSelectedVeiculo(veiculo);
      setForm(prev => ({ ...prev, veiculo_id: veiculo.id }));
    }
    
    setShowLocacaoSelection(false);
  };

  const adicionarAvaria = () => {
    if (novaAvaria.localizacao && novaAvaria.descricao) {
      setForm({
        ...form,
        avarias: [...form.avarias, novaAvaria]
      });
      setNovaAvaria({ tipo: 'A', localizacao: '', descricao: '' });
    }
  };

  const removerAvaria = (index: number) => {
    setForm({
      ...form,
      avarias: form.avarias.filter((_, i) => i !== index)
    });
  };

  const limparAssinaturaCliente = () => {
    sigClienteRef.current?.clear();
  };

  const limparAssinaturaVistoriador = () => {
    sigVistoriadorRef.current?.clear();
  };

  const salvarVistoria = async () => {
    if (!form.veiculo_id || !form.cliente_id) {
      alert('Selecione um cliente e um veículo!');
      return;
    }

    if (!selectedVeiculo || !selectedCliente) {
      alert('Dados do veículo ou cliente não encontrados!');
      return;
    }

    setLoading(true);

    try {
      const assinaturaCliente = sigClienteRef.current?.toDataURL() || '';
      const assinaturaVistoriador = sigVistoriadorRef.current?.toDataURL() || '';

      // Preparar dados conforme a estrutura da API
      const vistoriaData = {
        clienteId: form.cliente_id,
        veiculoId: form.veiculo_id,
        tipoVistoria: form.tipo_vistoria,
        quilometragem: form.quilometragem,
        combustivel: form.nivel_combustivel,
        condutor: form.nome_condutor,
        rgCondutor: form.rg_condutor,
        placa: selectedVeiculo.placa,
        modelo: `${selectedVeiculo.marca} ${selectedVeiculo.modelo}`,
        cor: selectedVeiculo.cor,
        observacoes: form.observacoes,
        nomeVistoriador: form.nome_vistoriador,
        assinaturaClienteUrl: assinaturaCliente,
        assinaturaVistoriadorUrl: assinaturaVistoriador,
        avariasJson: JSON.stringify(form.avarias),
        locacaoId: form.locacao_id,
        checklist: {
          calota: form.item_calota,
          pneu: form.item_pneu,
          antena: form.item_antena,
          bateria: form.item_bateria,
          estepe: form.item_estepe,
          macaco: form.item_macaco,
          chaveRoda: form.item_chave_roda,
          triangulo: form.item_triangulo,
          extintor: form.item_extintor,
          tapetes: form.item_tapetes,
          som: form.item_som,
          documentos: form.item_documentos,
          higienizacao: form.item_higienizacao
        }
      };

      const response = await fetch('http://localhost:3000/api/vistorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vistoriaData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar vistoria');
      }

      alert('Vistoria salva com sucesso!');
      resetarFormulario();
      
    } catch (error) {
      console.error('Erro ao salvar vistoria:', error);
      alert(`Erro ao salvar vistoria: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetarFormulario = () => {
    setForm({
      tipo_vistoria: 'entrada',
      locacao_id: null,
      veiculo_id: null,
      cliente_id: null,
      quilometragem: 0,
      nivel_combustivel: 'cheio',
      nome_condutor: '',
      rg_condutor: '',
      item_calota: true,
      item_pneu: true,
      item_antena: true,
      item_bateria: true,
      item_estepe: true,
      item_macaco: true,
      item_chave_roda: true,
      item_triangulo: true,
      item_extintor: true,
      item_tapetes: true,
      item_som: true,
      item_documentos: true,
      item_higienizacao: true,
      avarias: [],
      observacoes: '',
      nome_vistoriador: 'João Roberto'
    });
    setSelectedCliente(null);
    setSelectedVeiculo(null);
    setSelectedLocacao(null);
    sigClienteRef.current?.clear();
    sigVistoriadorRef.current?.clear();
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

  const itensObrigatorios = [
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
    { key: 'item_higienizacao', label: 'Higienização' }
  ];

  const tiposAvaria = [
    { value: 'A', label: 'Amassado' },
    { value: 'R', label: 'Risco' },
    { value: 'T', label: 'Trincado' },
    { value: 'Q', label: 'Quebrado' },
    { value: 'F', label: 'Falta' }
  ];

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

      {/* Dados do Veículo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dados do Veículo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Gauge className="inline mr-2" size={16} />
              Quilometragem
            </label>
            <input
              type="number"
              value={form.quilometragem}
              onChange={(e) => setForm({ ...form, quilometragem: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: 50000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Fuel className="inline mr-2" size={16} />
              Nível de Combustível
            </label>
            <select
              value={form.nivel_combustivel}
              onChange={(e) => setForm({ ...form, nivel_combustivel: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dados do Condutor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RG do Condutor
            </label>
            <input
              type="text"
              value={form.rg_condutor}
              onChange={(e) => setForm({ ...form, rg_condutor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: 12.345.678-9"
            />
          </div>
        </div>
      </div>

      {/* Itens Obrigatórios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Itens Obrigatórios
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itensObrigatorios.map(item => (
            <label
              key={item.key}
              className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={form[item.key as keyof VistoriaForm] as boolean}
                onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              {form[item.key as keyof VistoriaForm] ? (
                <CheckCircle2 className="text-green-500" size={18} />
              ) : (
                <XCircle className="text-red-500" size={18} />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Avarias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertCircle className="mr-2" size={24} />
          Avarias
        </h2>
        
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Legenda:
          </div>
          <div className="flex flex-wrap gap-3">
            {tiposAvaria.map(tipo => (
              <span key={tipo.value} className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{tipo.value}</strong> = {tipo.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={novaAvaria.tipo}
                onChange={(e) => setNovaAvaria({ ...novaAvaria, tipo: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {tiposAvaria.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localização
              </label>
              <input
                type="text"
                value={novaAvaria.localizacao}
                onChange={(e) => setNovaAvaria({ ...novaAvaria, localizacao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Para-choque dianteiro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={novaAvaria.descricao}
                onChange={(e) => setNovaAvaria({ ...novaAvaria, descricao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Amassado leve"
              />
            </div>
          </div>
          
          <button
            onClick={adicionarAvaria}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adicionar Avaria
          </button>
        </div>

        {form.avarias.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Avarias Registradas:</h3>
            {form.avarias.map((avaria, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div>
                  <span className="font-bold text-red-600 dark:text-red-400">{avaria.tipo}</span>
                  <span className="mx-2 text-gray-600 dark:text-gray-400">•</span>
                  <span className="text-gray-900 dark:text-white">{avaria.localizacao}</span>
                  <span className="mx-2 text-gray-600 dark:text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">{avaria.descricao}</span>
                </div>
                <button
                  onClick={() => removerAvaria(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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

      {/* Assinaturas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Assinaturas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assinatura do Cliente
            </label>
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <SignatureCanvas
                ref={sigClienteRef}
                canvasProps={{
                  className: 'w-full h-40 bg-white dark:bg-gray-700'
                }}
              />
            </div>
            <button
              onClick={limparAssinaturaCliente}
              className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Limpar Assinatura
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assinatura do Vistoriador
            </label>
            <input
              type="text"
              value={form.nome_vistoriador}
              onChange={(e) => setForm({ ...form, nome_vistoriador: e.target.value })}
              className="w-full px-4 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nome do vistoriador"
            />
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <SignatureCanvas
                ref={sigVistoriadorRef}
                canvasProps={{
                  className: 'w-full h-40 bg-white dark:bg-gray-700'
                }}
              />
            </div>
            <button
              onClick={limparAssinaturaVistoriador}
              className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Limpar Assinatura
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={salvarVistoria}
          disabled={loading || !selectedCliente || !selectedVeiculo}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={20} />
          {loading ? 'Salvando...' : 'Salvar Vistoria'}
        </button>
        
        <button
          onClick={resetarFormulario}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <XCircle size={20} />
          Cancelar
        </button>
      </div>
    </div>
  );
}