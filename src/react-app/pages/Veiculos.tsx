import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Car, DollarSign, Palette } from 'lucide-react';
import { useApi, useMutation } from '@/react-app/hooks/useApi';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import type { Veiculo, VeiculoCreate } from '@/shared/types';

export default function VeiculosPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Veiculo | null>(null);
  const [formData, setFormData] = useState<VeiculoCreate>({
    modelo: '',
    marca: '',
    ano: new Date().getFullYear(),
    placa: '',
    renavam: '',
    cor: '',
    valor_diaria: null,
    valor_veiculo: 0,
    tipo_operacao: 'ambos',
    status: 'disponivel',
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data: veiculos, loading, error, refetch } = useApi<Veiculo[]>(`/api/veiculos?${queryParams.toString()}`);
  const { mutate: createVeiculo, loading: creating } = useMutation<Veiculo, VeiculoCreate>();
  const { mutate: updateVeiculo, loading: updating } = useMutation<Veiculo, VeiculoCreate>();
  const { mutate: deleteVeiculo, loading: deleting } = useMutation();

  const isLoading = creating || updating || deleting;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    if (editingVehicle) {
      result = await updateVeiculo(`/api/veiculos/${editingVehicle.id}`, formData, 'PUT');
    } else {
      result = await createVeiculo('/api/veiculos', formData);
    }
    
    if (result) {
      resetForm();
      refetch();
    }
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingVehicle(veiculo);
    setFormData({
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
      placa: veiculo.placa,
      renavam: veiculo.renavam,
      cor: veiculo.cor,
      valor_diaria: veiculo.valor_diaria,
      valor_veiculo: veiculo.valor_veiculo,
      tipo_operacao: veiculo.tipo_operacao,
      status: veiculo.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (veiculo: Veiculo) => {
    if (confirm(`Tem certeza que deseja excluir o veículo ${veiculo.marca} ${veiculo.modelo}?`)) {
      try {
        const result = await deleteVeiculo(`/api/veiculos/${veiculo.id}`, {}, 'DELETE');
        if (result) {
          alert('Veículo excluído com sucesso!');
          refetch();
        } else {
          // Show specific error message
          const errorMessage = deleting.error || 'Erro ao excluir veículo. Verifique se o veículo não está sendo usado em locações ativas.';
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Erro ao deletar veículo:', error);
        alert('Erro inesperado ao excluir veículo. Tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      modelo: '',
      marca: '',
      ano: new Date().getFullYear(),
      placa: '',
      renavam: '',
      cor: '',
      valor_diaria: null,
      valor_veiculo: 0,
      tipo_operacao: 'ambos',
      status: 'disponivel',
    });
  };

  const formatPlate = (value: string) => {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .replace(/^([A-Z]{3})(\d{4})$/, '$1-$2')
      .substring(0, 8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-800';
      case 'locado':
        return 'bg-yellow-100 text-yellow-800';
      case 'vendido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'locado':
        return 'Locado';
      case 'vendido':
        return 'Vendido';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Veículos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie o cadastro de veículos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por modelo, marca ou placa..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="disponivel">Disponível</option>
          <option value="locado">Locado</option>
          <option value="vendido">Vendido</option>
        </select>
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border border-gray-300 dark:border-gray-600 w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marca *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      placeholder="Ex: Chevrolet"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Ex: Onix"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ano *
                    </label>
                    <input
                      type="number"
                      required
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Placa *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: formatPlate(e.target.value) })}
                      placeholder="ABC-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cor *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="Ex: Prata"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renavam *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.renavam}
                    onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                    placeholder="Digite o número do Renavam"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Operação *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.tipo_operacao}
                      onChange={(e) => setFormData({ ...formData, tipo_operacao: e.target.value as any })}
                    >
                      <option value="locacao">Somente Locação</option>
                      <option value="venda">Somente Venda</option>
                      <option value="ambos">Locação e Venda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="disponivel">Disponível</option>
                      <option value="locado">Locado</option>
                      <option value="vendido">Vendido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor da Diária (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.valor_diaria || ''}
                      onChange={(e) => setFormData({ ...formData, valor_diaria: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Ex: 120.00"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Necessário para locação</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor do Veículo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.valor_veiculo}
                      onChange={(e) => setFormData({ ...formData, valor_veiculo: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 45000.00"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : editingVehicle ? 'Atualizar' : 'Criar Veículo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {loading ? (
          <LoadingSpinner text="Carregando veículos..." />
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
            <p className="text-red-800 dark:text-red-200">Erro ao carregar veículos: {error}</p>
          </div>
        ) : !veiculos || veiculos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum veículo encontrado</p>
            {(search || statusFilter) && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente filtros diferentes</p>}
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            {veiculos.map((veiculo) => (
              <div
                key={veiculo.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {veiculo.marca} {veiculo.modelo} ({veiculo.ano})
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(veiculo.status)}`}>
                        {getStatusText(veiculo.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4" />
                        <span>{veiculo.placa}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Palette className="h-4 w-4" />
                        <span>{veiculo.cor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {veiculo.valor_diaria ? `${formatCurrency(veiculo.valor_diaria)}/dia` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(veiculo.valor_veiculo)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Tipo: {veiculo.tipo_operacao === 'ambos' ? 'Locação e Venda' : veiculo.tipo_operacao === 'locacao' ? 'Somente Locação' : 'Somente Venda'}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(veiculo)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(veiculo)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
