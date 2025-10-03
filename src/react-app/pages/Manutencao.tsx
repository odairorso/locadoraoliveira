import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Wrench, Car, Calendar, DollarSign, FileText, Save, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
}

interface Manutencao {
  id: number;
  veiculo_id: number;
  data_manutencao: string;
  tipo_manutencao: string;
  valor: number;
  descricao?: string;
  veiculos: Veiculo;
  created_at: string;
  updated_at: string;
}

interface ResumoVeiculo {
  veiculo: Veiculo;
  total: number;
  quantidade: number;
}

interface ManutencaoFormData {
  veiculo_id: string;
  data_manutencao: string;
  tipo_manutencao: string;
  valor: string;
  descricao: string;
}

// Função para formatar data ISO para exibição (dd/mm/yyyy)
const formatarDataParaExibicao = (dataISO: string): string => {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

const tiposManutencao = [
  'Troca de Óleo',
  'Revisão Geral',
  'Troca de Pneus',
  'Freios',
  'Suspensão',
  'Sistema Elétrico',
  'Ar Condicionado',
  'Transmissão',
  'Motor',
  'Carroceria',
  'Insufilme',
  'Lavagem e Enceramento',
  'Alinhamento e Balanceamento',
  'Troca de Filtros',
  'Bateria',
  'Embreagem',
  'Radiador',
  'Escapamento',
  'Vidros e Espelhos',
  'Estofamento',
  'Som e Multimídia',
  'Documentação',
  'Outros'
];

export default function Manutencao() {
  const { data: manutencoes, loading, error, refetch } = useApi<{
    data: Manutencao[];
    resumoPorVeiculo: Record<string, ResumoVeiculo>;
    total: number;
  }>('/api/manutencoes');

  const { data: veiculos } = useApi<Veiculo[]>('/api/veiculos');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ManutencaoFormData>({
    veiculo_id: '',
    data_manutencao: '',
    tipo_manutencao: '',
    valor: '',
    descricao: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  const [tipoPersonalizado, setTipoPersonalizado] = useState('');

  // Função para formatar data para exibição (dd/mm/yyyy)
  const formatarData = (data: string) => {
    if (!data) return '';
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar data para input (aaaa-mm-dd)
  const formatarDataInput = (data: string) => {
    if (!data) return '';
    // Remove todos os caracteres não numéricos
    const digits = data.replace(/\D/g, '');

    // Verifica se temos uma data no formato ddmmyyyy
    if (digits.length === 8) {
      const dia = digits.substring(0, 2);
      const mes = digits.substring(2, 4);
      const ano = digits.substring(4, 8);
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Tenta o formato original com barras (dd/mm/yyyy)
    const parts = data.split('/');
    if (parts.length === 3) {
      const [dia, mes, ano] = parts;
      if (dia && mes && ano && ano.length === 4) {
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }
    
    // Se nada funcionar, retorna o valor original, que provavelmente causará o erro esperado
    return data;
  };

  // Função para formatar valor em reais
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      veiculo_id: '',
      data_manutencao: '',
      tipo_manutencao: '',
      valor: '',
      descricao: ''
    });
    setEditingId(null);
    setShowForm(false);
    setTipoPersonalizado('');
  };

  // Abrir formulário para edição
  const handleEdit = (manutencao: Manutencao) => {
    // Verificar se o tipo de manutenção está na lista predefinida
    const tipoExiste = tiposManutencao.includes(manutencao.tipo_manutencao);
    
    setFormData({
      veiculo_id: manutencao.veiculo_id.toString(),
      data_manutencao: formatarDataParaExibicao(manutencao.data_manutencao),
      tipo_manutencao: tipoExiste ? manutencao.tipo_manutencao : 'Outros',
      valor: manutencao.valor.toString(),
      descricao: manutencao.descricao || ''
    });
    
    // Se não existe na lista, é um tipo personalizado
    if (!tipoExiste) {
      setTipoPersonalizado(manutencao.tipo_manutencao);
    } else {
      setTipoPersonalizado('');
    }
    
    setEditingId(manutencao.id);
    setShowForm(true);
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar tipo personalizado
    if (formData.tipo_manutencao === 'Outros' && !tipoPersonalizado.trim()) {
      alert('Por favor, especifique o tipo de manutenção.');
      return;
    }
    
    setSubmitting(true);

    try {
      const url = editingId ? `/api/manutencoes/${editingId}` : '/api/manutencoes';
      const method = editingId ? 'PUT' : 'POST';

      // A data deve ser formatada para o formato ISO (yyyy-mm-dd)
      const dataManutencao = formatarDataInput(formData.data_manutencao);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          veiculo_id: parseInt(formData.veiculo_id),
          data_manutencao: dataManutencao,
          tipo_manutencao: formData.tipo_manutencao === 'Outros' ? tipoPersonalizado : formData.tipo_manutencao,
          valor: parseFloat(formData.valor),
          descricao: formData.descricao || null
        }),
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        refetch();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      alert('Erro ao salvar manutenção');
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar manutenção
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta manutenção?')) {
      return;
    }

    try {
      const response = await fetch(`/api/manutencoes/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        refetch();
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error);
      alert('Erro ao deletar manutenção');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Erro ao carregar manutenções</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Wrench className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manutenção de Veículos</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie os gastos de manutenção da sua frota</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowResumo(!showResumo)}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">{showResumo ? 'Ocultar' : 'Ver'} Resumo</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Nova Manutenção</span>
          </button>
        </div>
      </div>

      {/* Resumo por Veículo */}
      {showResumo && manutencoes?.resumoPorVeiculo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="h-5 w-5" />
            Resumo de Gastos por Veículo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(manutencoes.resumoPorVeiculo).map((resumo) => (
              <div key={resumo.veiculo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {resumo.veiculo.marca} {resumo.veiculo.modelo}
                  </h3>
                  <span className="text-sm text-gray-500">{resumo.veiculo.placa}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Gasto:</span>
                    <span className="font-semibold text-green-600">{formatarValor(resumo.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manutenções:</span>
                    <span className="font-semibold">{resumo.quantidade}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  {editingId ? 'Editar Manutenção' : 'Nova Manutenção'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Veículo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="inline h-4 w-4 mr-1" />
                    Veículo *
                  </label>
                  <select
                    value={formData.veiculo_id}
                    onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                  >
                    <option value="">Selecione um veículo</option>
                    {veiculos?.map((veiculo) => (
                      <option key={veiculo.id} value={veiculo.id}>
                        {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Data da Manutenção *
                  </label>
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={formData.data_manutencao}
                    onChange={(e) => setFormData({ ...formData, data_manutencao: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                  />
                </div>

                {/* Tipo de Manutenção */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Wrench className="inline h-4 w-4 mr-1" />
                    Tipo de Manutenção *
                  </label>
                  <select
                    value={formData.tipo_manutencao}
                    onChange={(e) => setFormData({ ...formData, tipo_manutencao: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposManutencao.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo personalizado para "Outros" */}
                {formData.tipo_manutencao === 'Outros' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Wrench className="inline h-4 w-4 mr-1" />
                      Especifique o tipo de manutenção *
                    </label>
                    <input
                      type="text"
                      value={tipoPersonalizado}
                      onChange={(e) => setTipoPersonalizado(e.target.value)}
                      placeholder="Digite o tipo de manutenção..."
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                    />
                  </div>
                )}

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                    placeholder="0,00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Observações
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    placeholder="Observações adicionais sobre a manutenção..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base resize-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none font-medium"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Manutenções */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Histórico de Manutenções ({manutencoes?.total || 0})
          </h2>
        </div>

        {manutencoes?.data && manutencoes.data.length > 0 ? (
          <>
            {/* Layout para Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observações
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {manutencoes.data.map((manutencao) => (
                    <tr key={manutencao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <span>{formatarData(manutencao.data_manutencao)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                            <Car className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {manutencao.veiculos.marca} {manutencao.veiculos.modelo}
                            </div>
                            <div className="text-gray-500 text-xs">{manutencao.veiculos.placa}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                            <Wrench className="h-4 w-4 text-white" />
                          </div>
                          <span>{manutencao.tipo_manutencao}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatarValor(manutencao.valor)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {manutencao.descricao || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(manutencao)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(manutencao.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Layout para Mobile */}
            <div className="md:hidden">
              {manutencoes.data.map((manutencao) => (
                <div key={manutencao.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatarData(manutencao.data_manutencao)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(manutencao)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(manutencao.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                        <Car className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          {manutencao.veiculos.marca} {manutencao.veiculos.modelo}
                        </div>
                        <div className="text-gray-500 text-xs">{manutencao.veiculos.placa}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                        <Wrench className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-900">{manutencao.tipo_manutencao}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatarValor(manutencao.valor)}
                      </span>
                    </div>
                    
                    {manutencao.descricao && (
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm text-gray-600">{manutencao.descricao}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma manutenção registrada</h3>
            <p className="text-gray-500 mb-4">Comece registrando a primeira manutenção da sua frota.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Registrar Primeira Manutenção
            </button>
          </div>
        )}
      </div>
    </div>
  );
}