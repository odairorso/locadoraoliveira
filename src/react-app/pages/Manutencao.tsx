import { useState } from 'react';
import { Plus, Edit2, Trash2, Wrench, Car, Calendar, DollarSign, FileText, Save, X } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import ErrorMessage from '@/react-app/components/ErrorMessage';
import VehicleSelectModal from '@/react-app/components/VehicleSelectModal';
import { supabase } from '@/react-app/supabase';
import { formatCurrency } from '@/react-app/utils/formatters';
import type { Veiculo } from '@/shared/types';

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

  const { data: veiculos, loading: loadingVeiculos } = useApi<Veiculo[]>('/api/veiculos');

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

  const listaManutencoes: Manutencao[] = Array.isArray(manutencoes)
    ? (manutencoes as any)
    : (manutencoes?.data || []);
  const resumoMap: Record<string, ResumoVeiculo> = (manutencoes as any)?.resumoPorVeiculo || {};

  const formatarData = (data: string) => {
    if (!data) return '';
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
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
      // A data deve ser formatada para o formato ISO (yyyy-mm-dd)
      const dataManutencao = formatarDataInput(formData.data_manutencao);

      const payload = {
        veiculo_id: parseInt(formData.veiculo_id),
        data_manutencao: dataManutencao,
        tipo_manutencao: formData.tipo_manutencao === 'Outros' ? tipoPersonalizado : formData.tipo_manutencao,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao || null
      };

      // Consulta direta ao Supabase (respeita RLS e funciona no app Android,
      // ao contrário do antigo fetch('/api/manutencoes') que rodava como anon)
      if (editingId) {
        const { error } = await supabase.from('manutencoes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('manutencoes').insert([payload]);
        if (error) throw error;
      }

      resetForm();
      refetch();
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
      const { error } = await supabase.from('manutencoes').delete().eq('id', id);
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error);
      alert('Erro ao deletar manutenção');
    }
  };

  if (loading) return <LoadingSpinner text="Carregando manutenções..." />;
  if (error) return <ErrorMessage message={`Erro ao carregar manutenções: ${error}`} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#0f1422] border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Manutenção de Veículos</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Gerencie todos os gastos e revisões da sua frota</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowResumo(!showResumo)}
            className="bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs font-bold"
          >
            <FileText className="h-4 w-4 text-amber-400" />
            <span>{showResumo ? 'Ocultar' : 'Ver'} Resumo</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nova Manutenção</span>
          </button>
        </div>
      </div>

      {/* Resumo por Veículo */}
      {showResumo && Object.keys(resumoMap).length > 0 && (
        <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-black text-white mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-amber-400" />
            <span>Resumo de Gastos por Veículo</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Object.values(resumoMap).map((resumo) => (
              <div key={resumo.veiculo?.id || Math.random()} className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-white text-sm truncate pr-2">
                    {resumo.veiculo?.marca || 'Veículo'} {resumo.veiculo?.modelo || ''}
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex-shrink-0">
                    {resumo.veiculo?.placa || '-'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Gasto:</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">{formatCurrency(resumo.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Manutenções:</span>
                    <span className="font-bold text-slate-200">{resumo.quantidade || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#0f1422] border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-800">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-400" />
                  <span>{editingId ? 'Editar Manutenção' : 'Nova Manutenção'}</span>
                </h2>
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Veículo */}
                <div>
                  <VehicleSelectModal
                    selectedVehicleId={parseInt(formData.veiculo_id) || 0}
                    onSelectVehicle={(veiculo) => setFormData({ ...formData, veiculo_id: String(veiculo.id) })}
                    veiculos={veiculos || []}
                    loading={loadingVeiculos}
                    label="Veículo *"
                    required
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 text-amber-400" />
                    Data da Manutenção *
                  </label>
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={formData.data_manutencao}
                    onChange={(e) => setFormData({ ...formData, data_manutencao: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Tipo de Manutenção */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    <Wrench className="inline h-3.5 w-3.5 mr-1 text-amber-400" />
                    Tipo de Manutenção *
                  </label>
                  <select
                    value={formData.tipo_manutencao}
                    onChange={(e) => setFormData({ ...formData, tipo_manutencao: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Selecione o tipo</option>
                    {tiposManutencao.map((tipo) => (
                      <option key={tipo} value={tipo} className="bg-slate-900 text-white">
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo personalizado para "Outros" */}
                {formData.tipo_manutencao === 'Outros' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      <Wrench className="inline h-3.5 w-3.5 mr-1 text-amber-400" />
                      Especifique o tipo de manutenção *
                    </label>
                    <input
                      type="text"
                      value={tipoPersonalizado}
                      onChange={(e) => setTipoPersonalizado(e.target.value)}
                      placeholder="Digite o tipo de manutenção..."
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium"
                    />
                  </div>
                )}

                {/* Valor */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    <DollarSign className="inline h-3.5 w-3.5 mr-1 text-emerald-400" />
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
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-black font-mono"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    <FileText className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                    Observações
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    placeholder="Observações adicionais sobre a manutenção..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium resize-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 px-4 border border-slate-700 text-slate-300 bg-slate-900/80 hover:bg-slate-800 rounded-xl font-bold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Manutenções */}
      <div className="bg-[#0f1422] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <span>Histórico de Manutenções</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold border border-amber-500/30">
              {listaManutencoes.length}
            </span>
          </h2>
        </div>

        {listaManutencoes.length > 0 ? (
          <>
            {/* Layout para Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Observações
                    </th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-transparent">
                  {listaManutencoes.map((manutencao) => (
                    <tr key={manutencao.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold">{formatarData(manutencao.data_manutencao)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg">
                            <Car className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white">
                              {manutencao.veiculos?.marca || 'Veículo'} {manutencao.veiculos?.modelo || ''}
                            </div>
                            <div className="font-mono text-[11px] text-amber-400/90 font-bold">{manutencao.veiculos?.placa || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg">
                            <Wrench className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-200">{manutencao.tipo_manutencao}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg">
                            <DollarSign className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-black text-emerald-400 text-sm">
                            {formatCurrency(manutencao.valor)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                        {manutencao.descricao || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(manutencao)}
                            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(manutencao.id)}
                            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Layout para Mobile (Cards Escuros) */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {listaManutencoes.map((manutencao) => (
                <div key={manutencao.id} className="p-4 hover:bg-slate-800/20 transition-all space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {formatarData(manutencao.data_manutencao)}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(manutencao)}
                        className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(manutencao.id)}
                        className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg flex-shrink-0">
                        <Car className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {manutencao.veiculos?.marca || 'Veículo'} {manutencao.veiculos?.modelo || ''}
                        </div>
                        <div className="font-mono text-[11px] text-amber-400/90 font-bold mt-0.5">
                          {manutencao.veiculos?.placa || '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg">
                          <Wrench className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-slate-300">{manutencao.tipo_manutencao}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg">
                          <DollarSign className="h-3 w-3" />
                        </div>
                        <span className="font-black text-emerald-400 font-mono text-sm">
                          {formatCurrency(manutencao.valor)}
                        </span>
                      </div>
                    </div>
                    
                    {manutencao.descricao && (
                      <div className="flex items-start gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/70 text-slate-400 text-[11px] leading-relaxed">
                        <FileText className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>{manutencao.descricao}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Wrench className="h-7 w-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">Nenhuma manutenção registrada</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">Comece registrando os serviços ou despesas da sua frota.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-xs"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Registrar Primeira Manutenção</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}