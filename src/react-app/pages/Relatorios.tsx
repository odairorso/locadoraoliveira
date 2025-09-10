import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import type { DashboardStats } from '@/shared/types';

interface MovimentacaoFinanceira {
  id: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data_movimentacao: string;
  created_at: string;
}

export default function Relatorios() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/api/dashboard');
  const { data: movimentacoes, loading: movLoading } = useApi<MovimentacaoFinanceira[]>('/api/movimentacoes');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');

  const loading = statsLoading || movLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const movimentacoesFiltradas = movimentacoes?.filter(mov => {
    if (filtroTipo === 'todos') return true;
    return mov.tipo === filtroTipo;
  }) || [];

  const totalEntradas = movimentacoes?.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.valor, 0) || 0;
  const totalSaidas = movimentacoes?.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.valor, 0) || 0;

  if (loading) {
    return <LoadingSpinner text="Carregando relatórios..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios Financeiros</h1>
            <p className="text-gray-600 dark:text-gray-400">Acompanhe o desempenho financeiro do seu negócio</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium opacity-90">Total de Entradas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium opacity-90">Total de Saídas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingDown className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium opacity-90">Receita do Mês</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.receitaMes || 0)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Calendar className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium opacity-90">Saldo do Caixa</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.saldoCaixa || 0)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Movimentações Financeiras */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">Movimentações Financeiras</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroTipo === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('entrada')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroTipo === 'entrada'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFiltroTipo('saida')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroTipo === 'saida'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>

        {movimentacoesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma movimentação encontrada</p>
            <p className="text-sm">As movimentações financeiras aparecerão aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {movimentacoesFiltradas.map((movimentacao) => (
                  <tr key={movimentacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(movimentacao.data_movimentacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        movimentacao.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {movimentacao.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={movimentacao.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {movimentacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(movimentacao.valor)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}