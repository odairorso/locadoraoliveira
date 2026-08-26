import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react'; // Added Search icon for input
import { useApi, useMutation, mapVistoriaDbToChecklist } from '@/react-app/hooks/useApi'; // Import API hooks
import { supabase } from '@/react-app/supabase';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'; // Import useNavigate, useSearchParams and useParams
import CarDamageMap from '../components/CarDamageMap';
import PhotoCapture from '../components/PhotoCapture';

// Helper for debouncing search input
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Conforme o PRD
const checklistItems = [
  'Calota', 'Pneus (estado geral)', 'Antena', 'Bateria', 'Estepe', 'Macaco',
  'Chave de Roda', 'Triângulo', 'Extintor', 'Tapetes', 'Som/Sistema de áudio',
  'Documentos do veículo', 'Veículo higienizado'
];

const avariaLegendas = {
  'A': 'Amassado',
  'R': 'Risco',
  'T': 'Trincado',
  'Q': 'Quebrado',
  'F': 'Falta'
};

const VistoriaForm: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [searchParams] = useSearchParams();
  const { id } = useParams(); // Get ID from URL params for editing
  const isEditing = Boolean(id); // Check if we're in edit mode

  const [formData, setFormData] = useState({
    cliente: '',
    clienteId: null as string | null, // Changed to string for UUID
    placa: '',
    veiculoId: null as string | null, // Added veiculoId
    modelo: '',
    cor: '',
    quilometragem: '',
    condutor: '',
    telefone: '',
    dataHora: new Date().toLocaleString('pt-BR'),
    tipoVistoria: 'entrada' as 'entrada' | 'saida', // Added tipoVistoria
    combustivel: 'vazio' as string,
    observacoes: '',
    nomeVistoriador: '', // Added nome do vistoriador
    checklist: {} as Record<string, boolean>,
    avarias: [] as Array<{ id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F' }>,
    fotos: [] as Array<{ id: string, file: File, preview: string, description?: string }>
  });

  const [avarias, setAvarias] = useState<Array<{ id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F' }>>([]);
  const [selectedDamageType, setSelectedDamageType] = useState<'A' | 'R' | 'T' | 'Q' | 'F'>('A');
  const [photos, setPhotos] = useState<Array<{ id: string, file: File, preview: string, description?: string }>>([]);

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Estados para veículos locados
  const [veiculosLocados, setVeiculosLocados] = useState<any[]>([]);
  const [showVeiculosLocados, setShowVeiculosLocados] = useState(false);
  const [loadingVeiculosLocados, setLoadingVeiculosLocados] = useState(false);

  // Use useApi for client search
  const { loading: loadingClients } = useApi<any[]>(
    `/api/clientes`,
    { immediate: false }
  );

  const debouncedClientSearch = useRef(debounce(async (term: string) => {
    if (term.length > 2) {
      try {
        // Consulta direta ao Supabase (respeita RLS e funciona no app Android,
        // ao contrário do antigo fetch('/api/clientes') que rodava como anon)
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nome, telefone')
          .or(`nome.ilike.%${term}%,documento.ilike.%${term}%,celular.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(20);
        if (error) throw error;
        setClientSearchResults(data || []);
        setShowClientSuggestions(true);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        setClientSearchResults([]);
        setShowClientSuggestions(false);
      }
    } else {
      setClientSearchResults([]);
      setShowClientSuggestions(false);
    }
  }, 500)).current;



  useEffect(() => {
    if (clientSearchTerm) {
      debouncedClientSearch(clientSearchTerm);
    } else {
      setClientSearchResults([]);
      setShowClientSuggestions(false);
    }
  }, [clientSearchTerm, debouncedClientSearch]);

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setClientSearchTerm(value);
    setFormData(prev => ({ ...prev, cliente: value, clienteId: null })); // Clear ID if typing
  };

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({
      ...prev,
      cliente: client.nome,
      clienteId: client.id,
      telefone: client.telefone || prev.telefone, // Populate phone if available
    }));
    setClientSearchTerm(client.nome);
    setClientSearchResults([]);
    setShowClientSuggestions(false);
  };

  const handleVeiculoLocadoSelect = (locacao: any) => {
    setFormData(prev => ({
      ...prev,
      cliente: locacao.cliente_nome,
      clienteId: locacao.cliente_id,
      placa: locacao.placa,
      veiculoId: locacao.veiculo_id,
      modelo: locacao.modelo,
      telefone: locacao.cliente_telefone || prev.telefone,
    }));
    setShowVeiculosLocados(false);
  };

  // Detectar parâmetros da URL
  useEffect(() => {
    const tipo = searchParams.get('tipo') as 'entrada' | 'saida';
    const veiculoId = searchParams.get('veiculo_id');
    const entradaId = searchParams.get('entrada_id');
    const veiculoLocado = searchParams.get('veiculo_locado');
    const locacaoId = searchParams.get('locacaoId');

    if (tipo) {
      setFormData(prev => ({ ...prev, tipoVistoria: tipo }));
    }

    if (locacaoId) {
      carregarDadosLocacao(locacaoId);
    }

    // Se for vistoria de saída, carregar dados do veículo da vistoria de entrada
    if (tipo === 'saida' && veiculoId && entradaId) {
      carregarDadosVistoriaEntrada(entradaId);
    }

    if (tipo === 'entrada' && veiculoLocado === 'true') {
      carregarVeiculosLocados();
    }
  }, [searchParams]);

  const carregarDadosLocacao = async (locacaoId: string) => {
    try {
      const { data: locacao, error } = await supabase
        .from('locacoes')
        .select('*, clientes(nome, telefone), veiculos(marca, modelo, placa)')
        .eq('id', parseInt(locacaoId, 10))
        .maybeSingle();
      if (error) throw error;
      if (!locacao) {
        console.error('Locação não encontrada:', locacaoId);
        return;
      }

      setFormData(prev => ({
        ...prev,
        cliente: locacao.clientes?.nome || '',
        clienteId: locacao.cliente_id,
        placa: locacao.veiculos?.placa || '',
        veiculoId: locacao.veiculo_id,
        modelo: locacao.veiculos ? `${locacao.veiculos.marca || ''} ${locacao.veiculos.modelo || ''}`.trim() : '',
        condutor: locacao.clientes?.nome || '',
        telefone: locacao.clientes?.telefone || '',
      }));
      setClientSearchTerm(locacao.clientes?.nome || '');
      setVehicleSearchTerm(`${locacao.veiculos?.marca || ''} ${locacao.veiculos?.modelo || ''} - ${locacao.veiculos?.placa || ''}`.trim());

      const tipo = searchParams.get('tipo');

      if (tipo === 'saida') {
        try {
          const { data: vistorias } = await supabase
            .from('vistorias')
            .select('*')
            .eq('veiculo_id', locacao.veiculo_id)
            .eq('tipo_vistoria', 'entrada')
            .order('created_at', { ascending: false });

          const vistoriaEntrada = (vistorias || []).find((v: any) => v.locacao_id === parseInt(locacaoId, 10));
          if (vistoriaEntrada) {
            setFormData(prev => ({
              ...prev,
              quilometragem: vistoriaEntrada.quilometragem || '',
              combustivel: vistoriaEntrada.nivel_combustivel || 'vazio',
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar vistoria de entrada:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da locação:', error);
    }
  };

  const carregarVeiculosLocados = async () => {
    setLoadingVeiculosLocados(true);
    try {
      const { data, error } = await supabase
        .from('locacoes')
        .select('*, clientes(nome, telefone), veiculos(marca, modelo, placa)')
        .eq('status', 'ativa');
      if (error) throw error;
      setVeiculosLocados((data || []).map((l: any) => ({
        ...l,
        cliente_nome: l.clientes?.nome || 'Cliente não informado',
        cliente_telefone: l.clientes?.telefone || '',
        placa: l.veiculos?.placa || '',
        modelo: l.veiculos ? `${l.veiculos.marca || ''} ${l.veiculos.modelo || ''}`.trim() : '',
      })));
      setShowVeiculosLocados(true);
    } catch (error) {
      console.error('Erro ao carregar veículos locados:', error);
    } finally {
      setLoadingVeiculosLocados(false);
    }
  };

  const carregarDadosVistoriaEntrada = async (entradaId: string) => {
    try {
      const { data: vistoriaEntrada, error } = await supabase
        .from('vistorias')
        .select('*, clientes(nome, telefone), veiculos(marca, modelo, placa)')
        .eq('id', parseInt(entradaId, 10))
        .maybeSingle();
      if (error) throw error;
      if (!vistoriaEntrada) {
        console.error('Vistoria de entrada não encontrada:', entradaId);
        return;
      }
      setFormData(prev => ({
        ...prev,
        cliente: vistoriaEntrada.clientes?.nome || '',
        clienteId: vistoriaEntrada.cliente_id,
        placa: vistoriaEntrada.placa,
        veiculoId: vistoriaEntrada.veiculo_id,
        modelo: vistoriaEntrada.modelo,
        telefone: vistoriaEntrada.clientes?.telefone || '',
      }));
    } catch (error) {
      console.error('Erro ao carregar dados da vistoria de entrada:', error);
    }
  };

  const carregarVistoriaSaidaParaComparacao = async (locacaoId: string) => {
    try {
      const { data: vistorias, error } = await supabase
        .from('vistorias')
        .select('*')
        .eq('locacao_id', parseInt(locacaoId, 10))
        .eq('tipo_vistoria', 'saida')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;

      if (vistorias && vistorias.length > 0) {
        const vistoriaSaida = vistorias[0];
        setFormData(prev => ({
          ...prev,
          quilometragem: vistoriaSaida.quilometragem?.toString() || prev.quilometragem,
          combustivel: vistoriaSaida.nivel_combustivel || prev.combustivel,
          checklist: mapVistoriaDbToChecklist(vistoriaSaida),
          avarias: typeof vistoriaSaida.avarias === 'string' ? JSON.parse(vistoriaSaida.avarias) : (vistoriaSaida.avarias || []),
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar vistoria de saída para comparação:', error);
    }
  };



  // Load existing inspection data when editing
  useEffect(() => {
    if (isEditing && id) {
      const carregarVistoria = async () => {
        try {
          const { data: vistoria, error } = await supabase
            .from('vistorias')
            .select('*, clientes(nome, telefone), veiculos(marca, modelo, placa, cor)')
            .eq('id', parseInt(id, 10))
            .maybeSingle();
          if (error) throw error;
          if (!vistoria) {
            console.error('Vistoria não encontrada:', id);
            return;
          }

          const fotosSalvas = typeof vistoria.fotos === 'string'
            ? JSON.parse(vistoria.fotos || '[]')
            : (Array.isArray(vistoria.fotos) ? vistoria.fotos : []);

          setFormData({
            cliente: vistoria.clientes?.nome || '',
            clienteId: vistoria.cliente_id,
            placa: vistoria.veiculos?.placa || '',
            veiculoId: vistoria.veiculo_id,
            modelo: vistoria.veiculos ? `${vistoria.veiculos.marca || ''} ${vistoria.veiculos.modelo || ''}`.trim() : '',
            cor: vistoria.veiculos?.cor || '',
            quilometragem: vistoria.quilometragem?.toString() || '',
            condutor: vistoria.nome_condutor || '',
            telefone: vistoria.clientes?.telefone || '',
            dataHora: new Date(vistoria.created_at).toLocaleString('pt-BR'),
            tipoVistoria: vistoria.tipo_vistoria,
            combustivel: vistoria.nivel_combustivel || 'vazio',
            observacoes: vistoria.observacoes || '',
            checklist: mapVistoriaDbToChecklist(vistoria),
            avarias: typeof vistoria.avarias === 'string' ? JSON.parse(vistoria.avarias || '[]') : (vistoria.avarias || []),
            fotos: fotosSalvas,
            nomeVistoriador: vistoria.nome_vistoriador || ''
          });

          // Estados separados (avarias/fotos) recebem os dados carregados
          setAvarias(typeof vistoria.avarias === 'string' ? JSON.parse(vistoria.avarias || '[]') : (vistoria.avarias || []));
          setPhotos(fotosSalvas.map((f: string, i: number) => ({ id: String(i), file: null as any, preview: f })));

          // Atualiza os campos de busca para exibir os dados carregados
          setClientSearchTerm(vistoria.clientes?.nome || '');
          setVehicleSearchTerm(`${vistoria.veiculos?.marca || ''} ${vistoria.veiculos?.modelo || ''} - ${vistoria.veiculos?.placa || ''}`.trim());

          // Se for vistoria de entrada, carregar dados da vistoria de saída para comparação
          if (vistoria.tipo_vistoria === 'entrada' && vistoria.locacao_id) {
            carregarVistoriaSaidaParaComparacao(vistoria.locacao_id);
          }
        } catch (error) {
          console.error('Erro ao carregar vistoria:', error);
        }
      };

      carregarVistoria();
    }
  }, [isEditing, id]);

  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleSearchResults, setVehicleSearchResults] = useState<any[]>([]);
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);

  // Use useApi for vehicle search
  const { loading: loadingVehicles } = useApi<any[]>(
    `/api/veiculos`,
    { immediate: false }
  );

  const debouncedVehicleSearch = useRef(debounce(async (term: string) => {
    if (term.length > 2) {
      try {
        // Consulta direta ao Supabase (respeita RLS e funciona no app Android)
        const { data, error } = await supabase
          .from('veiculos')
          .select('id, placa, modelo, cor, marca, quilometragem_atual')
          .or(`modelo.ilike.%${term}%,marca.ilike.%${term}%,placa.ilike.%${term}%`)
          .limit(20);
        if (error) throw error;
        setVehicleSearchResults(data || []);
        setShowVehicleSuggestions(true);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        setVehicleSearchResults([]);
        setShowVehicleSuggestions(false);
      }
    } else {
      setVehicleSearchResults([]);
      setShowVehicleSuggestions(false);
    }
  }, 500)).current;



  useEffect(() => {
    if (vehicleSearchTerm) {
      debouncedVehicleSearch(vehicleSearchTerm);
    } else {
      setVehicleSearchResults([]);
      setShowVehicleSuggestions(false);
    }
  }, [vehicleSearchTerm, debouncedVehicleSearch]);

  const handleVehicleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setVehicleSearchTerm(value);
    setFormData(prev => ({ ...prev, placa: value, modelo: '', quilometragem: '' })); // Clear if typing
  };

  const handleVehicleSelect = (vehicle: any) => {
    setFormData(prev => ({
      ...prev,
      placa: vehicle.placa,
      veiculoId: vehicle.id,
      modelo: vehicle.modelo,
      cor: vehicle.cor,
      quilometragem: vehicle.quilometragem_atual || '',
    }));
    setVehicleSearchTerm(`${vehicle.modelo} - ${vehicle.placa}`);
    setVehicleSearchResults([]);
    setShowVehicleSuggestions(false);
  };

  const { mutate, loading: savingVistoria } = useMutation<any>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (item: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [item]: !prev.checklist[item]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId || !formData.veiculoId || !formData.quilometragem || !formData.combustivel || !formData.condutor || !formData.nomeVistoriador) {
      alert('Por favor, preencha todos os campos obrigatórios (Cliente, Placa, Quilometragem, Combustível, Condutor, Nome do Vistoriador).');
      return;
    }

    // O mapper em useApi (mapVistoriaPayloadToDb) converte os rótulos do
    // checklist (ex.: 'Calota', 'Pneus (estado geral)') para as colunas
    // item_* do banco. Não normalizar aqui (o código antigo gerava chaves
    // como 'pneus_estado_geral' que nunca casavam com o schema).
    const checklistData = formData.checklist;

    const payload = {
      clienteId: formData.clienteId,
      veiculoId: formData.veiculoId,
      tipoVistoria: formData.tipoVistoria,
      quilometragem: parseInt(formData.quilometragem),
      condutor: formData.condutor,
      telefone: formData.telefone,
      combustivel: formData.combustivel,
      observacoes: formData.observacoes,
      placa: formData.placa,
      modelo: formData.modelo,
      cor: formData.cor,
      nomeVistoriador: formData.nomeVistoriador || 'Sistema',
      checklist: checklistData,
      avariasJson: avarias,
      assinaturaClienteUrl: '',
      assinaturaVistoriadorUrl: '',
      fotos: photos,
    };

    const url = isEditing
      ? `/api/vistorias/${id}`
      : '/api/vistorias';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const result = await mutate(url, payload, method);
      if (result) {
        alert(isEditing ? 'Vistoria atualizada com sucesso!' : 'Vistoria salva com sucesso!');
        navigate('/checklist');
      } else {
        alert('Não foi possível salvar a vistoria. Tente novamente.');
      }
    } catch (err: any) {
      alert(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} vistoria: ${err?.message || 'erro desconhecido'}`);
    }
  };

  const handleCancel = () => {
    navigate('/checklist'); // Navigate back to dashboard
  };

  const handleDamageAdd = (damage: Omit<{ id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F' }, 'id'>) => {
    const newDamage = {
      ...damage,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setAvarias(prev => [...prev, newDamage]);
  };

  const handleDamageRemove = (id: string) => {
    setAvarias(prev => prev.filter(a => a.id !== id));
  };
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {isEditing
            ? `Editar Vistoria de ${formData.tipoVistoria === 'entrada' ? 'Entrada' : 'Saída'}`
            : `Nova Vistoria de ${formData.tipoVistoria === 'entrada' ? 'Entrada' : 'Saída'}`
          }
        </h1>
        {formData.tipoVistoria === 'saida' && (
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Comparação automática com vistoria de entrada será realizada
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Dados do Cliente e Veículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <input
                name="cliente"
                value={clientSearchTerm}
                onChange={handleClientSearchChange}
                onFocus={() => clientSearchResults.length > 0 && setShowClientSuggestions(true)}
                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 100)} // Hide after a short delay
                placeholder="Nome do Cliente ou CPF/CNPJ"
                className="w-full p-2 pl-10 border rounded"
                required
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              {loadingClients && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              {showClientSuggestions && clientSearchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                  {clientSearchResults.map((client) => (
                    <li
                      key={client.id}
                      onMouseDown={() => handleClientSelect(client)} // Use onMouseDown to prevent onBlur from firing first
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white"
                    >
                      {client.nome} ({client.cpf_cnpj})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lista de Veículos Locados */}
            {showVeiculosLocados && (
              <div className="col-span-full">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Selecione o Veículo Locado para Entrada
                </h3>
                {loadingVeiculosLocados ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando veículos locados...</span>
                  </div>
                ) : veiculosLocados.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {veiculosLocados.map((locacao) => (
                      <div
                        key={locacao.id}
                        onClick={() => handleVeiculoLocadoSelect(locacao)}
                        className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {locacao.placa} - {locacao.modelo}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Cliente: {locacao.cliente_nome}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Telefone: {locacao.cliente_telefone || 'Não informado'}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Clique para selecionar
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    Nenhum veículo locado encontrado
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <input
                name="placa"
                value={vehicleSearchTerm}
                onChange={handleVehicleSearchChange}
                onFocus={() => vehicleSearchResults.length > 0 && setShowVehicleSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 100)} // Hide after a short delay
                placeholder="Buscar veículo por placa, modelo ou marca..."
                className="w-full p-2 pl-10 border rounded"
                required
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              {loadingVehicles && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              {showVehicleSuggestions && vehicleSearchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                  {vehicleSearchResults.map((vehicle) => (
                    <li
                      key={vehicle.id}
                      onMouseDown={() => handleVehicleSelect(vehicle)} // Use onMouseDown to prevent onBlur from firing first
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white"
                    >
                      {vehicle.placa} - {vehicle.modelo} ({vehicle.marca})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input name="modelo" value={formData.modelo} onChange={handleInputChange} placeholder="Modelo do Veículo" className="p-2 border rounded" readOnly />
            <input name="quilometragem" value={formData.quilometragem} onChange={handleInputChange} placeholder="Quilometragem" type="number" className="p-2 border rounded" />
            <input name="condutor" value={formData.condutor} onChange={handleInputChange} placeholder="Nome do Condutor *" className="p-2 border rounded" required />
            <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" className="p-2 border rounded" />
            <input name="nomeVistoriador" value={formData.nomeVistoriador} onChange={handleInputChange} placeholder="Nome do Vistoriador *" className="p-2 border rounded" required />
            <input name="dataHora" value={formData.dataHora} placeholder="Data e Hora" className="p-2 border rounded bg-gray-100" readOnly />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Checklist de Itens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklistItems.map(item => (
              <label key={item} className="flex items-start space-x-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <input
                  type="checkbox"
                  checked={!!formData.checklist[item]}
                  onChange={() => handleChecklistChange(item)}
                  className="h-5 w-5 rounded mt-0.5 flex-shrink-0"
                />
                <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed break-words">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Combustível e Avarias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Nível de Combustível</h3>
              <div className="flex space-x-2">
                {[
                  { value: 'vazio', label: 'E' },
                  { value: '1/4', label: '1/4' },
                  { value: '1/2', label: '1/2' },
                  { value: '3/4', label: '3/4' },
                  { value: 'cheio', label: 'F' }
                ].map(level => (
                  <button key={level.value} type="button" onClick={() => setFormData(prev => ({ ...prev, combustivel: level.value }))} className={`px-4 py-2 rounded font-semibold ${formData.combustivel === level.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Diagrama de Avarias</h3>

              {/* Seletor de tipo de avaria */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tipo de Avaria:</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(avariaLegendas).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDamageType(key as 'A' | 'R' | 'T' | 'Q' | 'F')}
                      className={`px-3 py-1 rounded text-sm font-medium ${selectedDamageType === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {key} - {value}
                    </button>
                  ))}
                </div>
              </div>

              <CarDamageMap
                damages={avarias}
                onDamageAdd={handleDamageAdd}
                onDamageRemove={handleDamageRemove}
                selectedDamageType={selectedDamageType}
              />

              {/* Lista de avarias adicionadas */}
              {avarias.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Avarias Registradas:</h4>
                  <div className="space-y-1">
                    {avarias.map((avaria) => (
                      <div key={avaria.id} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        <span>{avaria.type} - {avariaLegendas[avaria.type]}</span>
                        <button
                          type="button"
                          onClick={() => handleDamageRemove(avaria.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Observações</h3>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} className="w-full p-2 border rounded" placeholder="Descreva aqui qualquer observação adicional..."></textarea>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Fotos da Vistoria</h3>
            <PhotoCapture
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={10}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center">
            <X className="mr-2" /> Cancelar
          </button>
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center" disabled={savingVistoria}>
            {savingVistoria ? 'Salvando...' : 'Salvar Vistoria'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VistoriaForm;