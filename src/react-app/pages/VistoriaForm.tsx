import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Search } from 'lucide-react'; // Added Search icon for input
import { useApi, useMutation } from '@/react-app/hooks/useApi'; // Import API hooks
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Helper for debouncing search input
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function(...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
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

  const [formData, setFormData] = useState({
    cliente: '',
    clienteId: null as string | null, // Changed to string for UUID
    placa: '',
    veiculoId: null as string | null, // Added veiculoId
    modelo: '',
    quilometragem: '',
    condutor: '',
    telefone: '',
    dataHora: new Date().toLocaleString('pt-BR'),
    tipoVistoria: 'entrada' as 'entrada' | 'saida', // Added tipoVistoria
    combustivel: '' as string,
    observacoes: '',
    checklist: {} as Record<string, boolean>,
  });

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Use useApi for client search
  const { execute: fetchClients, loading: loadingClients } = useApi<any[]>( // Added loadingClients
    `/api/clientes?search=${clientSearchTerm}`,
    { immediate: false }
  );

  const debouncedClientSearch = useRef(debounce(async (term: string) => {
    if (term.length > 2) {
      const response = await fetchClients(); // Call the execute function
      if (response && response.success && response.data) {
        setClientSearchResults(response.data);
        setShowClientSuggestions(true);
      } else {
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

      // Add tipoVistoria to formData state
      useEffect(() => {
        setFormData(prev => ({ ...prev, tipoVistoria: 'entrada' })); // Default for this form
      }, []);

      const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
      const [vehicleSearchResults, setVehicleSearchResults] = useState<any[]>([]);
      const [showVehicleSuggestions, setShowClientSuggestions] = useState(false);
  
        // Use useApi for vehicle search
        const { execute: fetchVehicles, loading: loadingVehicles } = useApi<any[]>(
          `/api/veiculos?search=${vehicleSearchTerm}`,
          { immediate: false }
        );
  
        const debouncedVehicleSearch = useRef(debounce(async (term: string) => {
          if (term.length > 2) {
            const response = await fetchVehicles();
            if (response && response.success && response.data) {
              setVehicleSearchResults(response.data);
              setShowVehicleSuggestions(true);
            } else {
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
          quilometragem: vehicle.quilometragem_atual || '',
        }));
        setVehicleSearchTerm(vehicle.placa);
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
          if (!formData.clienteId || !formData.veiculoId || !formData.quilometragem || !formData.combustivel) {
            alert('Por favor, preencha todos os campos obrigatórios (Cliente, Placa, Quilometragem, Combustível).');
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
            checklist: checklistData,
            avariasJson: {}, // Placeholder for now
            assinaturaClienteUrl: '',
            assinaturaVistoriadorUrl: '',
          };
  
          console.log('Payload para API:', payload);
  
          const result = await mutate('/api/vistorias', payload, 'POST');
  
          if (result) {
            alert('Vistoria salva com sucesso!');
            navigate('/checklist'); // Navigate back to dashboard
          } else if (saveError) {
            alert(`Erro ao salvar vistoria: ${saveError}`);
          }
        };
  
        const handleCancel = () => {
          navigate('/checklist'); // Navigate back to dashboard
        };
  return (
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
          <div className="relative">
            <input
              name="placa"
              value={vehicleSearchTerm}
              onChange={handleVehicleSearchChange}
              onFocus={() => vehicleSearchResults.length > 0 && setShowVehicleSuggestions(true)}
              onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 100)} // Hide after a short delay
              placeholder="Placa do Veículo"
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
              }
              </ul>
            )}
          </div>
          <input name="modelo" value={formData.modelo} onChange={handleInputChange} placeholder="Modelo do Veículo" className="p-2 border rounded" readOnly />
          <input name="quilometragem" value={formData.quilometragem} onChange={handleInputChange} placeholder="Quilometragem" type="number" className="p-2 border rounded" />
          <input name="condutor" value={formData.condutor} onChange={handleInputChange} placeholder="Nome do Condutor" className="p-2 border rounded" />
          <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" className="p-2 border rounded" />
          <input name="dataHora" value={formData.dataHora} placeholder="Data e Hora" className="p-2 border rounded bg-gray-100" readOnly />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Checklist de Itens</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {checklistItems.map(item => (
            <label key={item} className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={!!formData.checklist[item]} onChange={() => handleChecklistChange(item)} className="h-5 w-5 rounded" />
              <span className="text-gray-700 dark:text-gray-300">{item}</span>
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
              {['E', '1/4', '1/2', '3/4', 'F'].map(level => (
                <button key={level} type="button" onClick={() => setFormData(prev => ({...prev, combustivel: level}))} className={`px-4 py-2 rounded font-semibold ${formData.combustivel === level ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Diagrama de Avarias (Placeholder)</h3>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <p className="text-gray-500">[Visualização do carro aqui]</p>
            </div>
            <div className="text-xs mt-2 grid grid-cols-3 gap-1">
              {Object.entries(avariaLegendas).map(([key, value]) => (
                <span key={key}>{`${key} = ${value}`}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
            <h3 className="font-semibold mb-2">Observações</h3>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} className="w-full p-2 border rounded" placeholder="Descreva aqui qualquer observação adicional..."></textarea>
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
  );
};

export default VistoriaForm;
