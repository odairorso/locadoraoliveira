import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react'; // Added Search icon for input
import { useApi, useMutation } from '@/react-app/hooks/useApi'; // Import API hooks
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
    avarias: [] as Array<{id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F'}>,
    fotos: [] as Array<{id: string, file: File, preview: string, description?: string}>
  });

  const [avarias, setAvarias] = useState<Array<{id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F'}>>([]);
  const [selectedDamageType, setSelectedDamageType] = useState<'A' | 'R' | 'T' | 'Q' | 'F'>('A');
  const [photos, setPhotos] = useState<Array<{id: string, file: File, preview: string, description?: string}>>([]);
  const [vistoriaSaida, setVistoriaSaida] = useState<any>(null); // State for comparison data

  const [confrontoState, setConfrontoState] = useState<Record<string, boolean>>({});

  const handleConfrontoChange = (item: string) => {
    setConfrontoState(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };


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
        const response = await fetch(`/api/clientes?search=${encodeURIComponent(term)}`);
        const result = await response.json();
        if (result.success && result.data) {
          setClientSearchResults(result.data);
          setShowClientSuggestions(true);
        } else {
          setClientSearchResults([]);
          setShowClientSuggestions(false);
        }
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
        
        console.log('VistoriaForm - Parâmetros da URL:', { tipo, veiculoId, entradaId, veiculoLocado, locacaoId });
        
        if (tipo) {
          console.log('VistoriaForm - Definindo tipo de vistoria:', tipo);
          setFormData(prev => ({ ...prev, tipoVistoria: tipo }));
        }

        if (locacaoId) {
          carregarDadosLocacao(locacaoId);
        }
        
        // Se for vistoria de saída, carregar dados do veículo da vistoria de entrada
        if (tipo === 'saida' && veiculoId && entradaId) {
          console.log('VistoriaForm - Carregando dados da vistoria de entrada:', entradaId);
          carregarDadosVistoriaEntrada(entradaId);
        }
        
        // Se for entrada de veículo locado, carregar lista de veículos locados
        if (tipo === 'entrada' && veiculoLocado === 'true') {
          console.log('VistoriaForm - Carregando veículos locados');
          carregarVeiculosLocados();
        }
      }, [searchParams]);

      const carregarDadosLocacao = async (locacaoId: string) => {
        try {
          console.log('VistoriaForm - Carregando dados da locação:', locacaoId);
          const response = await fetch(`/api/locacoes/${locacaoId}`);
          const result = await response.json();
          if (result.success && result.data) {
            const locacao = result.data;
            console.log('VistoriaForm - Dados da locação carregados:', locacao);
            
            setFormData(prev => ({
              ...prev,
              cliente: locacao.cliente_nome,
              clienteId: locacao.cliente_id,
              placa: locacao.veiculo_placa,
              veiculoId: locacao.veiculo_id,
              modelo: locacao.veiculo_modelo,
              condutor: locacao.cliente_nome, // Default condutor to client name
              telefone: locacao.cliente_telefone,
            }));
            // Also update search terms to reflect the loaded data
            setClientSearchTerm(locacao.cliente_nome);
            setVehicleSearchTerm(`${locacao.veiculo_modelo} - ${locacao.veiculo_placa}`);
            
            // For exit inspections, also load entry inspection data for comparison
            const tipo = searchParams.get('tipo');
            console.log('VistoriaForm - Tipo de vistoria detectado:', tipo);
            console.log('VistoriaForm - SearchParams completos:', Object.fromEntries(searchParams.entries()));
            
            if (tipo === 'saida') {
              console.log('VistoriaForm - É vistoria de saída! Buscando vistoria de entrada por locação:', locacaoId);
              
              try {
                // Buscar diretamente por locacao_id e tipo=entrada (a API retorna um array)
                const apiUrl = `/api/vistorias?locacao_id=${locacaoId}&tipo=entrada`;
                console.log('VistoriaForm - URL da API (entrada por locação):', apiUrl);
                
                const vistoriasResponse = await fetch(apiUrl);
                const vistoriasResult = await vistoriasResponse.json();
                
                console.log('VistoriaForm - Resposta da API de vistorias (entrada por locação):', vistoriasResult);
                
                if (vistoriasResult.success && Array.isArray(vistoriasResult.data) && vistoriasResult.data.length > 0) {
                  const vistoriaEntrada = vistoriasResult.data[0];
                  console.log('VistoriaForm - ✅ Vistoria de entrada encontrada para a locação! Preenchendo dados:', vistoriaEntrada);
                  // Preencher dados da entrada para comparação
                  setFormData(prev => ({
                    ...prev,
                    quilometragem: vistoriaEntrada.quilometragem?.toString() || prev.quilometragem,
                    combustivel: vistoriaEntrada.nivel_combustivel || prev.combustivel,
                  }));
                  console.log('VistoriaForm - Dados preenchidos - Quilometragem:', vistoriaEntrada.quilometragem, 'Combustível:', vistoriaEntrada.nivel_combustivel);
                } else {
                  console.log('VistoriaForm - ❌ Nenhuma vistoria de entrada encontrada para esta locação');
                }
              } catch (error) {
                console.error('VistoriaForm - ❌ Erro ao buscar vistoria de entrada:', error);
              }
            } else {
              console.log('VistoriaForm - Não é vistoria de saída, pulando busca de vistoria de entrada');
            }
          } else {
            console.error('Erro ao carregar dados da locação:', result.error);
          }
        } catch (error) {
          console.error('Erro ao carregar dados da locação:', error);
        }
      };

      const carregarVeiculosLocados = async () => {
        setLoadingVeiculosLocados(true);
        try {
          const response = await fetch('/api/locacoes?status=ativa');
          const result = await response.json();
          
          if (result.success && result.data) {
            setVeiculosLocados(result.data);
            setShowVeiculosLocados(true);
          } else {
            console.error('Erro ao carregar veículos locados:', result.error);
          }
        } catch (error) {
          console.error('Erro ao carregar veículos locados:', error);
        } finally {
          setLoadingVeiculosLocados(false);
        }
      };

      const carregarDadosVistoriaEntrada = async (entradaId: string) => {
        try {
          console.log('VistoriaForm - Fazendo chamada para API:', `/api/vistorias/${entradaId}`);
          const response = await fetch(`/api/vistorias/${entradaId}`);
          const result = await response.json();
          
          console.log('VistoriaForm - Resposta da API:', result);
          
          if (result.success && result.data) {
            const v = result.data;
            console.log('VistoriaForm - Dados da vistoria de entrada:', v);
            
            // Montar checklist a partir das colunas da base
            const checklistFromDB = {
              calota: !!v.item_calota,
              pneu: !!v.item_pneu,
              antena: !!v.item_antena,
              bateria: !!v.item_bateria,
              estepe: !!v.item_estepe,
              macaco: !!v.item_macaco,
              chaveRoda: !!v.item_chave_roda,
              triangulo: !!v.item_triangulo,
              extintor: !!v.item_extintor,
              tapetes: !!v.item_tapetes,
              som: !!v.item_som,
              documentos: !!v.item_documentos,
              higienizacao: !!v.item_higienizacao,
            };
            
            setFormData(prev => ({
              ...prev,
              cliente: v.clientes?.nome || prev.cliente || '',
              clienteId: v.cliente_id,
              placa: v.veiculos?.placa || prev.placa || '',
              veiculoId: v.veiculo_id,
              modelo: v.veiculos?.modelo || prev.modelo || '',
              telefone: v.clientes?.telefone || prev.telefone || '',
              quilometragem: v.quilometragem?.toString() || prev.quilometragem,
              combustivel: v.nivel_combustivel || prev.combustivel,
              checklist: checklistFromDB,
              avarias: v.avarias || prev.avarias,
              fotos: v.fotos || prev.fotos,
            }));
            console.log('VistoriaForm - FormData atualizado com sucesso');
          } else {
            console.error('VistoriaForm - Erro na resposta da API:', result);
          }
        } catch (error) {
          console.error('VistoriaForm - Erro ao carregar dados da vistoria de entrada:', error);
        }
      };

      const carregarVistoriaSaidaParaComparacao = async (locacaoId: string) => {
        try {
          console.log('VistoriaForm - Buscando vistoria de saída para locação:', locacaoId);
          const response = await fetch(`/api/vistorias?locacao_id=${locacaoId}&tipo=saida`);
          const result = await response.json();
          
          console.log('VistoriaForm - Resposta da busca de vistoria de saída:', result);
          
          if (result.success && result.data && result.data.length > 0) {
            const vSaida = result.data[0]; // Pega a primeira vistoria de saída encontrada
            console.log('VistoriaForm - Dados da vistoria de saída para comparação:', vSaida);
            
            // Montar checklist da vistoria de saída a partir das colunas da base
            const checklistSaida = {
              calota: !!vSaida.item_calota,
              pneu: !!vSaida.item_pneu,
              antena: !!vSaida.item_antena,
              bateria: !!vSaida.item_bateria,
              estepe: !!vSaida.item_estepe,
              macaco: !!vSaida.item_macaco,
              chaveRoda: !!vSaida.item_chave_roda,
              triangulo: !!vSaida.item_triangulo,
              extintor: !!vSaida.item_extintor,
              tapetes: !!vSaida.item_tapetes,
              som: !!vSaida.item_som,
              documentos: !!vSaida.item_documentos,
              higienizacao: !!vSaida.item_higienizacao,
            };

            // Guardar dados da saída em estado separado para confronto na UI
            setVistoriaSaida({
              quilometragem: vSaida.quilometragem,
              combustivel: vSaida.nivel_combustivel,
              checklist: checklistSaida,
              avarias: (() => {
                try {
                  if (typeof vSaida.avarias === 'string') return JSON.parse(vSaida.avarias);
                  return vSaida.avarias || [];
                } catch {
                  return [];
                }
              })(),
              fotos: (() => {
                try {
                  if (typeof vSaida.fotos === 'string') return JSON.parse(vSaida.fotos);
                  return vSaida.fotos || [];
                } catch {
                  return [];
                }
              })(),
            });

            // Preencher apenas quilometragem e combustível no form principal, sem sobrescrever checklist/avarias
            setFormData(prev => ({
              ...prev,
              quilometragem: prev.quilometragem && prev.quilometragem !== '' 
                ? prev.quilometragem 
                : (vSaida.quilometragem?.toString() || prev.quilometragem || ''),
              combustivel: prev.combustivel && prev.combustivel !== '' 
                ? prev.combustivel 
                : (vSaida.nivel_combustivel || prev.combustivel || 'vazio'),
            }));
            
            console.log('VistoriaForm - Dados da vistoria de saída carregados para comparação no estado vistoriaSaida');
          } else {
            console.log('VistoriaForm - Nenhuma vistoria de saída encontrada para a locação:', locacaoId);
          }
        } catch (error) {
          console.error('VistoriaForm - Erro ao carregar vistoria de saída para comparação:', error);
        }
      };



      // Load existing inspection data when editing
      useEffect(() => {
        if (isEditing && id) {
          const carregarVistoria = async () => {
            try {
              const response = await fetch(`/api/vistorias/${id}`);
              const result = await response.json();
              
              if (result.success && result.data) {
                const vistoria = result.data;
                const clienteNome = vistoria.clientes?.nome || '';
                const veiculoPlaca = vistoria.veiculos?.placa || '';
                const veiculoModelo = vistoria.veiculos?.modelo || '';

                setFormData({
                  cliente: clienteNome,
                  clienteId: vistoria.cliente_id,
                  placa: veiculoPlaca,
                  veiculoId: vistoria.veiculo_id,
                  modelo: veiculoModelo,
                  cor: vistoria.veiculos?.cor || '',
                  quilometragem: vistoria.quilometragem?.toString() || '',
                  condutor: vistoria.nome_condutor || '',
                  telefone: vistoria.clientes?.telefone || '',
                  dataHora: new Date(vistoria.created_at).toLocaleString('pt-BR'),
                  tipoVistoria: vistoria.tipo_vistoria,
                  combustivel: vistoria.nivel_combustivel || 'vazio',
                  observacoes: vistoria.observacoes || '',
                  checklist: vistoria.checklist || {},
                  avarias: vistoria.avarias || [],
                  fotos: vistoria.fotos || [],
                  nomeVistoriador: vistoria.nome_vistoriador || ''
                });

                // Atualiza os campos de busca para exibir os dados carregados
                setClientSearchTerm(clienteNome);
                setVehicleSearchTerm(`${veiculoModelo} - ${veiculoPlaca}`);

                // Se for vistoria de entrada, carregar dados da vistoria de saída para comparação
                if (vistoria.tipo_vistoria === 'entrada' && vistoria.locacao_id) {
                  console.log('VistoriaForm - Carregando vistoria de saída para comparação, locacao_id:', vistoria.locacao_id);
                  carregarVistoriaSaidaParaComparacao(vistoria.locacao_id);
                }
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
              const response = await fetch(`/api/veiculos?search=${encodeURIComponent(term)}`);
              const result = await response.json();
              if (result.success && result.data) {
                setVehicleSearchResults(result.data);
                setShowVehicleSuggestions(true);
              } else {
                setVehicleSearchResults([]);
                setShowVehicleSuggestions(false);
              }
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

      const { mutate, loading: savingVistoria, error: saveError } = useMutation<any>();

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
  
          const checklistData: Record<string, boolean> = {};
          Object.keys(formData.checklist).forEach(key => {
            const dbKey = key.toLowerCase()
                             .replace(/\s*\([^)]*\)\s*/g, '')
                             .replace(/[\s\/]/g, '_')
                             .replace(/_$/, '');
            checklistData[dbKey] = formData.checklist[key];
          });
  
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
            nomeVistoriador: formData.nomeVistoriador || 'Sistema', // Include nome do vistoriador
            checklist: checklistData,
            avariasJson: avarias, // Use actual avarias state
            assinaturaClienteUrl: '',
            assinaturaVistoriadorUrl: '',
            fotos: photos, // Include photos in payload
            confronto: confrontoState, // Include comparison data
          };
  
          console.log('Payload para API:', payload);
          console.log('Combustível sendo enviado:', formData.combustivel);
  
          const url = isEditing 
            ? `/api/vistorias/${id}`
            : '/api/vistorias';
          const method = isEditing ? 'PUT' : 'POST';
          
          const result = await mutate(url, payload, method);
  
          if (result) {
            alert(isEditing ? 'Vistoria atualizada com sucesso!' : 'Vistoria salva com sucesso!');
            navigate('/checklist'); // Navigate back to dashboard
          } else if (saveError) {
            alert(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} vistoria: ${saveError}`);
          }
        };
  
        const handleCancel = () => {
          navigate('/checklist'); // Navigate back to dashboard
        };

        const handleDamageAdd = (damage: Omit<{id: string, x: number, y: number, type: 'A' | 'R' | 'T' | 'Q' | 'F'}, 'id'>) => {
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
              placeholder="Nome do Cliente ou CPF"
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
                    {client.nome} ({client.cpf})
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

      {/* Checklist Comparison Table */}
      {vistoriaSaida && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confronto de Checklist (Saída vs. Entrada)</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Item</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Vistoria de Saída</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Vistoria de Entrada</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Confrontado</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map(item => {
                  // Normalize the key to match the database format if needed
                  const itemKey = item.toLowerCase()
                                     .replace(/\s*\([^)]*\)\s*/g, '')
                                     .replace(/[\s\/]/g, '_')
                                     .replace(/_$/, '');
                  
                  const saidaStatus = vistoriaSaida.checklist ? !!vistoriaSaida.checklist[itemKey] : false;
                  
                  return (
                    <tr key={item} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3 text-gray-800 dark:text-gray-200">{item}</td>
                      <td className="p-3 text-center">
                        {saidaStatus 
                          ? <span className="text-green-500 font-bold">OK</span> 
                          : <span className="text-red-500 font-bold">Não OK</span>}
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!formData.checklist[item]} 
                          onChange={() => handleChecklistChange(item)} 
                          className="h-6 w-6 rounded"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!confrontoState[item]} 
                          onChange={() => handleConfrontoChange(item)} 
                          className="h-6 w-6 rounded text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Original Checklist (only shows if not in comparison mode) */}
      {!vistoriaSaida && (
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
      )}

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
                <button key={level.value} type="button" onClick={() => setFormData(prev => ({...prev, combustivel: level.value}))} className={`px-4 py-2 rounded font-semibold ${formData.combustivel === level.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
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
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedDamageType === key 
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