import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, FileText, Calendar, DollarSign, User, Car, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApi, useMutation } from '@/react-app/hooks/useApi';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import type { Locacao, LocacaoCreate, Cliente, Veiculo } from '@/shared/types';

export default function LocacoesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState<Locacao | null>(null);
  
  const [formData, setFormData] = useState<LocacaoCreate>({
    cliente_id: 0,
    veiculo_id: 0,
    data_locacao: new Date().toISOString().split('T')[0],
    data_entrega: '',
    valor_diaria: 0,
    valor_total: 0,
    valor_caucao: 0,
    status: 'ativa',
    observacoes: '',
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data: locacoes, loading, error, refetch } = useApi<(Locacao & { cliente_nome: string; veiculo_info: string })[]>(`/api/locacoes?${queryParams.toString()}`);
  const { data: clientes, loading: loadingClientes } = useApi<Cliente[]>('/api/clientes?limit=100');
  const { data: veiculosDisponiveis, loading: loadingVeiculos } = useApi<Veiculo[]>('/api/veiculos?status=disponivel');
  const { mutate: createLocacao, loading: creating } = useMutation<Locacao, LocacaoCreate>();
  const { mutate: updateLocacao, loading: updating } = useMutation<Locacao, LocacaoCreate>();
  const { mutate: deleteLocacao, loading: deleting } = useMutation();

  const isLoading = creating || updating || deleting;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter]);

  const calculateTotal = () => {
    if (formData.data_locacao && formData.data_entrega && formData.valor_diaria) {
      const startDate = new Date(formData.data_locacao);
      const endDate = new Date(formData.data_entrega);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const total = days > 0 ? days * formData.valor_diaria : 0;
      setFormData(prev => ({ ...prev, valor_total: total }));
    }
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.data_locacao, formData.data_entrega, formData.valor_diaria]);

  const handleVeiculoChange = (veiculoId: number) => {
    const veiculo = veiculosDisponiveis?.find(v => v.id === veiculoId);
    if (veiculo && veiculo.valor_diaria) {
      setFormData(prev => ({
        ...prev,
        veiculo_id: veiculoId,
        valor_diaria: veiculo.valor_diaria || 0
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.valor_total <= 0) {
      alert('Valor total deve ser maior que zero');
      return;
    }

    let result;
    if (editingLocacao) {
      result = await updateLocacao(`/api/locacoes/${editingLocacao.id}?id=${editingLocacao.id}`, formData, 'PUT');
    } else {
      result = await createLocacao('/api/locacoes', formData);
    }
    
    if (result) {
      resetForm();
      refetch();
    }
  };

  const handleEdit = (locacao: Locacao) => {
    setEditingLocacao(locacao);
    setFormData({
      cliente_id: locacao.cliente_id,
      veiculo_id: locacao.veiculo_id,
      data_locacao: locacao.data_locacao,
      data_entrega: locacao.data_entrega,
      valor_diaria: locacao.valor_diaria,
      valor_total: locacao.valor_total,
      valor_caucao: locacao.valor_caucao || 0,
      status: locacao.status,
      observacoes: locacao.observacoes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (locacao: Locacao) => {
    if (confirm(`Tem certeza que deseja excluir esta locação?`)) {
      console.log('Tentando excluir locação:', locacao.id);
      const result = await deleteLocacao(`/api/locacoes/${locacao.id}`, {}, 'DELETE');
      console.log('Resultado da exclusão:', result);
      if (result) {
        console.log('Exclusão bem-sucedida, atualizando lista...');
        refetch();
      } else {
        console.error('Falha na exclusão');
      }
    }
  };

  const handleFinishLocacao = async (locacao: Locacao) => {
    if (confirm('Tem certeza que deseja finalizar esta locação?')) {
      console.log('🔄 Iniciando finalização da locação:', locacao.id);
      console.log('📊 Dados da locação:', {
        id: locacao.id,
        cliente_id: locacao.cliente_id,
        veiculo_id: locacao.veiculo_id,
        status_atual: locacao.status
      });
      
      try {
        console.log('📤 Enviando requisição PUT para:', `/api/locacoes/${locacao.id}`);
        console.log('📋 Payload da requisição:', {
          cliente_id: locacao.cliente_id,
          veiculo_id: locacao.veiculo_id,
          data_locacao: locacao.data_locacao,
          data_entrega: locacao.data_entrega,
          valor_diaria: locacao.valor_diaria,
          valor_total: locacao.valor_total,
          valor_caucao: locacao.valor_caucao || 0,
          status: 'finalizada',
          observacoes: locacao.observacoes || ''
        });
        
        const result = await updateLocacao(`/api/locacoes/${locacao.id}`, {
          cliente_id: locacao.cliente_id,
          veiculo_id: locacao.veiculo_id,
          data_locacao: locacao.data_locacao,
          data_entrega: locacao.data_entrega,
          valor_diaria: locacao.valor_diaria,
          valor_total: locacao.valor_total,
          valor_caucao: locacao.valor_caucao || 0,
          status: 'finalizada',
          observacoes: locacao.observacoes || ''
        }, 'PUT');
        
        console.log('✅ Resultado da finalização:', result);
        console.log('📈 Tipo do resultado:', typeof result);
        console.log('🔍 Resultado é truthy?', !!result);
        
        if (result) {
          console.log('✅ Finalização bem-sucedida, atualizando lista...');
          refetch();
        } else {
          console.error('❌ Falha na finalização - resultado falsy');
          alert('Erro: A finalização retornou um resultado inválido. Verifique o console para mais detalhes.');
        }
} catch (error: any) {
      const err: any = error;
      console.error('Erro detalhado ao finalizar locação:', {
        error,
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data,
        stack: err?.stack
      });
      
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      const errorStatus = err?.response?.status || 'N/A';
      
      alert(`❌ Erro ao finalizar locação:\n\nStatus: ${errorStatus}\nMensagem: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLocacao(null);
    setFormData({
      cliente_id: 0,
      veiculo_id: 0,
      data_locacao: new Date().toISOString().split('T')[0],
      data_entrega: '',
      valor_diaria: 0,
      valor_total: 0,
      valor_caucao: 0,
      status: 'ativa',
      observacoes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200';
      case 'finalizada':
        return 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200';
      case 'cancelada':
        return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'Ativa';
      case 'finalizada':
        return 'Finalizada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Clock className="h-4 w-4" />;
      case 'finalizada':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    // Se contiver uma barra, é uma data dd/mm/yyyy parcial ou completa.
    if (dateString.includes('/')) {
      return dateString;
    }
    // Se contiver um hífen, provavelmente é uma data yyyy-mm-dd do estado.
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      // Verifica se é uma estrutura yyyy-mm-dd válida antes de dividir.
      if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    // Caso contrário, é uma entrada parcial (por exemplo, "1", "12") que ainda não foi formatada.
    // Retorna como está para evitar o erro "undefined/undefined/...".
    return dateString;
  };

  const formatDateFromInput = (dateString: string) => {
    if (!dateString) return '';
    // Convert from dd/mm/yyyy to yyyy-mm-dd for input value
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractData, setContractData] = useState<any>(null);

  const viewContract = async (locacao: Locacao) => {
    try {
      console.log('=== INÍCIO viewContract ===');
      console.log('Carregando contrato para locação:', locacao.id);
      console.log('Estado atual showContractPreview:', showContractPreview);
      console.log('Estado atual contractData:', contractData);
      
      const response = await fetch(`/api/locacoes/${locacao.id}/contrato-data`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Dados recebidos do contrato:', data);
      
      if (data.success) {
        console.log('Dados do contrato:', data.data);
        console.log('Definindo contractData...');
        setContractData(data.data);
        console.log('Definindo showContractPreview como true...');
        setShowContractPreview(true);
        console.log('Estados definidos! Modal deveria aparecer agora.');
      } else {
        console.error('Erro na resposta:', data.error);
        alert('Erro ao carregar dados do contrato');
      }
      console.log('=== FIM viewContract ===');
    } catch (error) {
      console.error('Erro ao carregar contrato:', error);
      alert('Erro ao carregar contrato');
    }
  };

  const downloadContract = async (locacao: Locacao) => {
    try {
      const response = await fetch(`/api/locacoes/${locacao.id}/contrato`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-locacao-${locacao.id}.html`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      alert('Erro ao gerar contrato');
    }
  };

  const printContract = () => {
    const printContent = document.getElementById('contract-content');
    if (printContent) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Contrato de Locação</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { height: 80px; margin-bottom: 20px; }
                h1 { margin: 20px 0; }
                h3 { margin: 20px 0 10px 0; }
                p { margin: 10px 0; }
                .signature-section { margin-top: 50px; }
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                .signature { text-align: center; width: 200px; }
                .signature-line { border-top: 1px solid black; padding-top: 5px; margin-top: 30px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        newWindow.document.close();
        newWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Locações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie contratos de locação de veículos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!clientes?.length || !veiculosDisponiveis?.length}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Locação
        </button>
      </div>

      {/* Alert if no clients or vehicles */}
      {(!clientes?.length || !veiculosDisponiveis?.length) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            {!clientes?.length && !veiculosDisponiveis?.length 
              ? 'É necessário cadastrar clientes e veículos antes de criar locações.'
              : !clientes?.length 
                ? 'É necessário cadastrar clientes antes de criar locações.'
                : 'É necessário ter veículos disponíveis para criar locações.'
            }
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por cliente ou veículo..."
            className="pl-10 pr-4 py-3 sm:py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="ativa">Ativa</option>
          <option value="finalizada">Finalizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Rental Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 sm:top-10 mx-auto p-3 sm:p-5 border border-gray-200 dark:border-gray-600 w-full sm:w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-none sm:rounded-md bg-white dark:bg-gray-800 max-h-screen overflow-y-auto">
            <div className="mt-1 sm:mt-3">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                {editingLocacao ? 'Editar Locação' : 'Nova Locação'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cliente *
                    </label>
                    <select
                      required
                      disabled={loadingClientes}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.cliente_id}
                      onChange={(e) => setFormData({ ...formData, cliente_id: parseInt(e.target.value) })}
                    >
                      <option value={0}>Selecione um cliente</option>
                      {clientes?.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.cpf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Veículo *
                    </label>
                    <select
                      required
                      disabled={loadingVeiculos || editingLocacao !== null}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.veiculo_id}
                      onChange={(e) => handleVeiculoChange(parseInt(e.target.value))}
                    >
                      <option value={0}>Selecione um veículo</option>
                      {veiculosDisponiveis?.map(veiculo => (
                        <option key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa} - {formatCurrency(veiculo.valor_diaria || 0)}/dia
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Locação *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.data_locacao ? formatDateForInput(formData.data_locacao) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const formattedValue = rawValue.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2}\/\d{2})(\d)/, '$1/$2');
                        
                        if (rawValue.length === 8) {
                          const formattedDate = formatDateFromInput(formattedValue);
                          setFormData({ ...formData, data_locacao: formattedDate });
                        } else {
                          setFormData({ ...formData, data_locacao: formattedValue });
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.data_entrega ? formatDateForInput(formData.data_entrega) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const formattedValue = rawValue.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2}\/\d{2})(\d)/, '$1/$2');
                        
                        if (rawValue.length === 8) {
                          const formattedDate = formatDateFromInput(formattedValue);
                          setFormData({ ...formData, data_entrega: formattedDate });
                        } else {
                          setFormData({ ...formData, data_entrega: formattedValue });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor da Diária (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.valor_diaria}
                      onChange={(e) => setFormData({ ...formData, valor_diaria: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dias
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={(() => {
                        if (formData.data_locacao && formData.data_entrega) {
                          const startDate = new Date(formData.data_locacao);
                          const endDate = new Date(formData.data_entrega);
                          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                            return diff >= 0 ? diff : 0;
                          }
                        }
                        return 0;
                      })()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor Total (R$)
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 font-bold text-green-600 dark:text-green-400 text-base sm:text-sm"
                      value={formatCurrency(formData.valor_total)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor da Caução (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.valor_caucao || ''}
                      onChange={(e) => setFormData({ ...formData, valor_caucao: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 500.00"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deixe 0 se isento</p>
                  </div>
                </div>

                {editingLocacao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais sobre a locação..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 min-h-[44px]"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 min-h-[44px]"
                    disabled={isLoading || formData.valor_total <= 0}
                  >
                    {isLoading ? 'Salvando...' : editingLocacao ? 'Atualizar' : 'Criar Locação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rentals List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {loading ? (
          <LoadingSpinner text="Carregando locações..." />
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
            <p className="text-red-800 dark:text-red-200">Erro ao carregar locações: {error}</p>
          </div>
        ) : !locacoes || locacoes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma locação encontrada</p>
            {(search || statusFilter) && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente filtros diferentes</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {locacoes.map((locacao) => (
              <div key={locacao.id} className="p-3 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Locação #{locacao.id}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start ${getStatusColor(locacao.status)}`}>
                        {getStatusIcon(locacao.status)}
                        <span className="ml-1">{getStatusText(locacao.status)}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{locacao.cliente_nome}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{locacao.veiculo_info}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{formatDate(locacao.data_locacao)} a {formatDate(locacao.data_entrega)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <span className="font-semibold">{formatCurrency(locacao.valor_total)}</span>
                      </div>
                    </div>

                    {locacao.observacoes && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Observações:</strong> <span className="break-words">{locacao.observacoes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 sm:ml-4 overflow-x-auto sm:overflow-x-visible">
                    <button
                      onClick={() => viewContract(locacao)}
                      className="inline-flex items-center px-2 sm:px-3 py-2 sm:py-1.5 border border-blue-300 dark:border-blue-600 text-xs font-medium rounded text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-800 hover:bg-blue-100 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 whitespace-nowrap"
                    >
                      <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Ver Contrato</span>
                      <span className="sm:hidden">Ver</span>
                    </button>
                    
                    <button
                      onClick={() => downloadContract(locacao)}
                      className="inline-flex items-center px-2 sm:px-3 py-2 sm:py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 whitespace-nowrap"
                    >
                      <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Baixar</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                    
                    {locacao.status === 'ativa' && (
                      <button
                        onClick={() => handleFinishLocacao(locacao)}
                        className="inline-flex items-center px-2 sm:px-3 py-2 sm:py-1.5 border border-green-300 dark:border-green-600 text-xs font-medium rounded text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-800 hover:bg-green-100 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-h-[44px] sm:min-h-0 whitespace-nowrap"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="hidden sm:inline">Finalizar</span>
                        <span className="sm:hidden">Fim</span>
                      </button>
                    )}
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(locacao)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                        disabled={isLoading}
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(locacao)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Preview Modal */}
      {showContractPreview && contractData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 sm:top-5 mx-auto p-2 sm:p-5 border border-gray-200 dark:border-gray-600 w-full sm:w-11/12 max-w-4xl shadow-lg rounded-none sm:rounded-md bg-white dark:bg-gray-800 max-h-screen overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Visualizar Contrato</h3>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={printContract}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => setShowContractPreview(false)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
            
            <div id="contract-content" className="bg-white text-black p-2 sm:p-4 md:p-8" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.4', fontSize: window.innerWidth < 640 ? '10px' : '12px' }}>
              <div className="text-center mb-4 sm:mb-8">
                <h1 className="text-2xl font-bold">Oliveira Veiculos</h1>
                <p>Av. Campo Grande, 707 - Centro, Navirai - MS, 79947-033</p>
                <p>Tel 3461-9864  Cel-67 99622-9840 67 999913-5153</p>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 mt-4">CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
              </div>

              <div style={{ color: '#000', fontSize: window.innerWidth < 640 ? '10px' : '12px', lineHeight: '1.4' }}>
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0' }}><strong>Entre:</strong></p>
                
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}>
                  a pessoa jurídica OR DOS SANTOS DE OLIVEIRA LTDA, inscrita sob o CNPJ n.º 17.909.442/0001-58, 
                  com sede em Av campo grande 707 centro, neste ato representada, conforme poderes especialmente 
                  conferidos, por: João Roberto dos Santos de Oliveira, na qualidade de: Administrador, 
                  CPF n.º 008.714.291-01, carteira de identidade n.º 1447272 doravante denominada <strong>LOCADORA</strong>, e:
                </p>
                
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}>
                  <strong>{contractData?.cliente_nome || '[Nome do Cliente]'}</strong>, CPF n.º <strong>{contractData?.cliente_cpf || '[CPF]'}</strong>, 
                  residente em: <strong>{contractData?.endereco_completo || '[Endereço]'}</strong>,
                  doravante denominado <strong>LOCATÁRIO</strong>.
                </p>

                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0' }}>As partes acima identificadas têm entre si justo e acertado o presente contrato de locação de veículo, ficando desde já aceito nas cláusulas e condições abaixo descritas.</p>

                <h3 style={{ margin: window.innerWidth < 640 ? '15px 0 8px 0' : '20px 0 10px 0', fontWeight: 'bold', fontSize: window.innerWidth < 640 ? '11px' : '12px' }}>CLÁUSULA 1ª – DO OBJETO</h3>
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}>Por meio deste contrato, que firmam entre si a LOCADORA e o LOCATÁRIO, regula-se a locação do veículo:</p>
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}><strong>{contractData?.veiculo_marca || '[Marca]'} {contractData?.veiculo_modelo || '[Modelo]'} ano {contractData?.veiculo_ano || '[Ano]'}</strong></p>
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}>Com placa <strong>{contractData?.veiculo_placa || '[Placa]'}</strong>, e com o valor de mercado aproximado em <strong>{contractData?.valor_veiculo_formatted || '[Valor]'}</strong>.</p>
                <p style={{ margin: window.innerWidth < 640 ? '5px 0' : '10px 0', textAlign: 'justify' }}>Parágrafo único. O presente contrato é acompanhado de um laudo de vistoria, que descreve o veículo e o seu estado de conservação no momento em que o mesmo foi entregue ao LOCATÁRIO.</p>

                <h3 style={{ margin: window.innerWidth < 640 ? '15px 0 8px 0' : '20px 0 10px 0', fontWeight: 'bold', fontSize: window.innerWidth < 640 ? '11px' : '12px' }}>CLÁUSULA 2ª – DO VALOR DO ALUGUEL</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O valor da diária do aluguel, livremente ajustado pelas partes, é de <strong>{contractData?.valor_diaria_formatted || '[Valor da Diária]'}</strong>. O valor total da locação é de <strong>{contractData?.valor_total_formatted || '[Valor Total]'}</strong> para o período estabelecido.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. O LOCATÁRIO deverá efetuar o pagamento do valor acordado, por meio de pix, utilizando a chave 17909442000158, ou em espécie, ou cartão.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. Em caso de atraso no pagamento do aluguel, será aplicada multa de 5% (cinco por cento), sobre o valor devido, bem como juros de mora de 3% (três por cento) ao mês, mais correção monetária, apurada conforme variação do IGP-M no período.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 3º. O LOCATÁRIO, não vindo a efetuar o pagamento do aluguel por um período de atraso superior à 7 (sete) dias, fica sujeito a ter a posse do veículo configurada como Apropriação Indébita, implicando também a possibilidade de adoção de medidas judiciais, inclusive a Busca e Apreensão do veículo e/ou lavratura de Boletim de Ocorrência, cabendo ao LOCATÁRIO ressarcir a LOCADORA das despesas oriundas da retenção indevida do bem, arcando ainda com as despesas judiciais e/ou extrajudiciais que a LOCADORA venha a ter para efetuar a busca, apreensão e efetiva reintegração da posse do veículo.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 4º. Será de responsabilidade do LOCATÁRIO as despesas referentes à utilização do veículo.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 5º. O valor do aluguel firmado neste contrato será reajustado a cada 12 (doze) meses, tendo como base o índice IGP. Em caso de falta deste índice, o reajuste do valor da locação terá por base a média da variação dos índices inflacionários do ano corrente ao da execução da locação.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 3ª – DO PRAZO DO ALUGUEL</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O prazo de locação do referido veículo é de <strong>{contractData?.data_locacao_formatted || '[Data Início]'} a {contractData?.data_entrega_formatted || '[Data Fim]'}</strong>.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Ao final do prazo estipulado, caso as partes permaneçam inertes, a locação prorrogar-se-á automaticamente por tempo indeterminado.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. Caso a LOCADORA não queira prorrogar a locação ao terminar o prazo estipulado neste contrato, e o referido veículo não for devolvido, será cobrado o valor do aluguel proporcional aos dias de atraso acumulado de multa diária de <strong>{contractData?.valor_diaria_formatted || '[Valor da Diária]'}</strong>.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 3º. Finda a locação, o LOCATÁRIO deverá devolver o veículo nas mesmas condições em que recebeu, salvo os desgastes decorrentes do uso normal, sob pena de indenização por perdas e danos a ser apurada.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 4ª – DO COMBUSTÍVEL</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O veículo será entregue ao LOCATÁRIO com um tanque de combustível completo, e sua quantidade será marcada no laudo de vistoria no momento da retirada.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Ao final do prazo estipulado, o LOCATÁRIO deverá devolver o veículo à LOCADORA com o tanque de combustível completo.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. Caso não ocorra o cumprimento do parágrafo anterior, será cobrado o valor correspondente a leitura do marcador em oitavos, com base em tabela própria, e o valor do litro será informado no momento da retirada pela LOCADORA.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 3º. Caso seja constatado a utilização de combustível adulterado, o LOCATÁRIO responderá pelo mesmo e pelos danos decorrentes de tal utilização.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 4º. Fica desde já acordado que o LOCATÁRIO não terá direito a ressarcimento caso devolva o veículo com uma quantidade de combustível superior a que recebeu.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 5ª – DA LIMPEZA</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O veículo será entregue ao LOCATÁRIO limpo e deverá ser devolvido à LOCADORA nas mesmas condições higiênicas que foi retirado.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Caso o veículo seja devolvido sujo, interna ou externamente, será cobrada uma taxa de lavagem simples ou especial, dependendo do estado do veículo na devolução.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. Caso haja a necessidade de lavagem especial, será cobrada, além da taxa de lavagem, o valor mínimo de (uma) diária de locação, ou quantas diárias forem necessárias até a disponibilização do veículo para locação, limitado a 5 (cinco) diárias do veículo com base na tarifa vigente.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 6ª – DA UTILIZAÇÃO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Deverá também o LOCATÁRIO utilizar o veículo alugado sempre de acordo com os regulamentos estabelecidos pelo Conselho Nacional de Trânsito (CONTRAN) e pelo Departamento Estadual de Trânsito (DETRAN).</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. A utilização do veículo de forma diferente do descrito acima estará sujeita à cobrança de multa, assim como poderá a LOCADORA dar por rescindido o presente contrato independente de qualquer notificação, e sem maiores formalidades poderá também proceder com o recolhimento do veículo sem que seja ensejada qualquer pretensão para ação indenizatória, reparatória ou compensatória pelo LOCATÁRIO.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 3º. Qualquer modificação no veículo só poderá ser feita com a autorização expressa da LOCADORA.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 4º. O LOCATÁRIO declara estar ciente que quaisquer danos causados, materiais ou pessoais, decorrente da utilização do veículo ora locado, será de sua responsabilidade.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 7ª – RESTRIÇÃO TERRITORIAL</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O LOCATÁRIO se compromete a utilizar o veículo exclusivamente dentro do território nacional brasileiro, sendo expressamente proibida sua saída para qualquer outro país. O descumprimento desta cláusula implicará em multa de R$ 280,00 (duzentos e oitenta reais) e rescisão imediata do presente contrato, sem prejuízo das demais medidas legais cabíveis.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 8ª – DAS MULTAS E INFRAÇÕES</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>As multas ou quaisquer outras infrações às leis de trânsito, cometidas durante o período da locação do veículo, serão de responsabilidade do LOCATÁRIO, devendo ser liquidadas quando da notificação pelos órgãos competentes ou no final do contrato, o que ocorrer primeiro.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Em caso de apreensão do veículo, serão cobradas do LOCATÁRIO todas as despesas de serviço dos profissionais envolvidos para liberação do veículo alugado, assim como todas as taxas cobradas pelos órgãos competentes, e também quantas diárias forem necessárias até a disponibilização do veículo para locação.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. O LOCATÁRIO declara-se ciente e concorda que se ocorrer qualquer multa ou infração de trânsito durante a vigência deste contrato, seu nome poderá ser indicado pela LOCADORA junto ao Órgão de Trânsito autuante, na qualidade de condutor do veículo, tendo assim a pontuação recebida transferida para sua carteira de habilitação.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 3º. A LOCADORA poderá preencher os dados relativos à "apresentação do Condutor", previsto na Resolução 404/12 do CONTRAN, caso tenha sido lavrada autuação por infrações de trânsito enquanto o veículo esteve em posse e responsabilidade do LOCATÁRIO, situação na qual a LOCADORA apresentará para o Órgão de Trânsito competente a cópia do presente contrato celebrado com o LOCATÁRIO.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 4º. Descabe qualquer discussão sobre a procedência ou improcedência das infrações de trânsito aplicadas, e poderá o LOCATÁRIO, a seu critério e às suas expensas, recorrer das multas, junto ao Órgão de Trânsito competente, o que não o eximirá do pagamento do valor da multa, mas lhe dará o direito ao reembolso, caso o recurso seja julgado procedente.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 9ª – DA VEDAÇÃO À SUBLOCAÇÃO E EMPRÉSTIMO DO VEÍCULO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Será permitido o uso do veículo objeto do presente contrato, apenas pelo LOCATÁRIO, sendo vedada, no todo ou em parte, a sublocação, transferência, empréstimo, comodato ou cessão da locação, seja a qualquer título, sem expressa anuência da LOCADORA, sob pena de imediata rescisão, aplicação de multa e de demais penalidades contratuais e legais cabíveis.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Parágrafo único. Ocorrendo a utilização do veículo por terceiros com a concordância do LOCATÁRIO, este se responsabilizará por qualquer ação civil ou criminal que referida utilização possa gerar, isentando assim a LOCADORA de qualquer responsabilidade, ou ônus.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 10ª – DA MANUTENÇÃO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>A manutenção do veículo, referente a troca das peças oriundas do desgaste natural de sua utilização, é de responsabilidade do LOCATÁRIO, sem ônus para a LOCADORA.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Parágrafo único. Se durante o período da manutenção o LOCATÁRIO não dispor do bem, ou de outro de categoria igual ou similar, terá desconto no aluguel, proporcional ao período de manutenção.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 11ª – DA UTILIZAÇÃO DO SEGURO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Ocorrendo a necessidade da utilização do seguro veicular, registrado em nome da LOCADORA, devido à perda, extravio, furto, roubo, destruição parcial ou total, ou colisão do veículo por ora locado, fica desde já estipulada indenização devida pelo LOCATÁRIO que deverá, para efeito de cobertura do valor da franquia do seguro veicular, pagar à LOCADORA o valor de R$ 3.520,00 (três mil e quinhentos e vinte reais).</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 12ª – DOS DEVERES DO LOCATÁRIO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Sem prejuízo de outras disposições deste contrato, constituem obrigações do LOCATÁRIO:</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>I – pagar o aluguel e os encargos da locação, legal ou contratualmente exigíveis, no prazo estipulado;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>II – usar o veículo como foi convencionado, de acordo com a sua natureza e com o objetivo a que se destina;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>III – cuidar e zelar do veículo como se fosse sua propriedade;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>IV – restituir o veículo, no final da locação, no estado em que o recebeu, conforme o laudo de vistoria, salvo as deteriorações decorrentes do seu uso normal;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>V – levar imediatamente ao conhecimento da LOCADORA o surgimento de qualquer dano, ou ocorrência, cuja reparação, e ou indenização, a esta enquadre;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>VI – reparar rapidamente os danos sob sua responsabilidade;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>VII – não modificar a forma interna ou externa do veículo sem o consentimento prévio e por escrito da LOCADORA.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 13ª – DOS DEVERES DA LOCADORA</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Sem prejuízo de outras disposições deste contrato, constituem obrigações da LOCADORA:</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>I – entregar ao LOCATÁRIO o veículo alugado em estado de servir ao uso a que se destina;</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>II – ser integralmente responsável pelos problemas, defeitos e vícios anteriores à locação.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 14ª – DA GARANTIA</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>O cumprimento das obrigações previstas neste contrato, inclusive o pagamento pontual do aluguel, estará garantido por caução dada em dinheiro, perfazendo o montante de {contractData.valor_caucao_formatted} {contractData.valor_caucao_extenso}, entregue à LOCADORA no ato de assinatura deste contrato.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Ao final da locação, tendo sido todas as obrigações devidamente cumpridas, o LOCATÁRIO estará autorizado a levantar a respectiva soma.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. A critério das partes, o valor dado como caução poderá ser revertido para o pagamento de aluguéis devidos.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 15ª – DA RESCISÃO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>As partes poderão rescindir o contrato unilateralmente, sem apresentação de justificativa.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Parágrafo único. Em cumprimento ao princípio da boa-fé, as partes se comprometem a informar uma à outra qualquer fato que possa porventura intervir na relação jurídica formalizada através do presente contrato.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 16ª – DAS PENALIDADES</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>A parte que violar as obrigações previstas neste contrato se sujeitará ao pagamento de indenização e ressarcimento pelas perdas, danos, lucros cessantes, danos indiretos e quaisquer outros prejuízos patrimoniais ou morais percebidos pela outra parte em decorrência deste descumprimento, sem prejuízo de demais penalidades legais ou contratuais cabíveis.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 1º. Caso ocorra uma violação, este contrato poderá ser rescindido de pleno direito pela parte prejudicada, sem a necessidade aviso prévio.</p>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>§ 2º. Ocorrendo uma tolerância de uma das partes em relação ao descumprimento das cláusulas contidas neste instrumento não se configura em renúncia ou alteração da norma infringida.</p>

                <h3 style={{ margin: '20px 0 10px 0', fontWeight: 'bold' }}>CLÁUSULA 17ª – DO FORO</h3>
                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Fica desde já eleito o foro da comarca de Naviraí para serem resolvidas eventuais pendências decorrentes deste contrato.</p>

                <p style={{ margin: '10px 0', textAlign: 'justify' }}>Por estarem assim certos e ajustados, firmam os signatários este instrumento em 02 (duas) vias de igual teor e forma.</p>

                {contractData.observacoes && (
                  <div style={{ margin: '20px 0' }}>
                    <h3 style={{ fontWeight: 'bold' }}>OBSERVAÇÕES:</h3>
                    <p style={{ margin: '10px 0', textAlign: 'justify' }}>{contractData.observacoes}</p>
                  </div>
                )}

                <div style={{ marginTop: '50px' }}>
                  <p style={{ margin: '10px 0' }}>Naviraí, {contractData?.data_atual_formatted || '[Data Atual]'}</p>
                  
                  <div style={{ marginTop: '60px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                      <div style={{ borderTop: '1px solid black', paddingTop: '5px', marginTop: '30px', display: 'inline-block', minWidth: '300px' }}>
                        <strong>LOCADORA</strong><br />
                        João Roberto dos Santos de Oliveira<br />
                        neste ato representando a pessoa jurídica<br />
                        Or dos Santos de Oliveira
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid black', paddingTop: '5px', marginTop: '30px', display: 'inline-block', minWidth: '300px' }}>
                        <strong>LOCATÁRIO</strong><br />
                        {contractData.cliente_nome}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
