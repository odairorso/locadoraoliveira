import { Car, Users, FileText, DollarSign, Wallet, TrendingUp, Award, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/react-app/components/DashboardCard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { useApi } from '@/react-app/hooks/useApi';
import type { DashboardStats } from '@/shared/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Home() {
  const { data: stats, loading, error } = useApi<DashboardStats>('/api/dashboard');
  const { data: advancedStats, loading: loadingAdvanced } = useApi('/api/dashboard-stats');
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner text="Carregando dashboard..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
        <p className="text-red-800 dark:text-red-200">Erro ao carregar dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-gray-900 rounded-xl p-8 text-white shadow-2xl border border-slate-700">
        <div className="flex items-center space-x-6">
          <div className="bg-white bg-opacity-10 p-4 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
            <img
              src="https://mocha-cdn.com/01988471-cbda-7e3e-9eda-75676806ade8/ChatGPT-Image-6-de-ago.-de-2025,-07_.png"
              alt="Logo Oliveira Veículos"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">Sistema Oliveira Veículos</h1>
            <p className="text-gray-300 text-lg mb-1">
              Gestão completa de locação e venda de veículos
            </p>
            <p className="text-gray-400 text-sm">
              Contato: (67) 99622.9840 | veiculos.oliveira@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Locações Ativas"
          value={stats?.locacoesAtivas || 0}
          icon={FileText}
          color="blue"
          subtitle="contratos em andamento"
          onClick={() => navigate('/locacoes?status=ativa')}
        />
        <DashboardCard
          title="Veículos Disponíveis"
          value={stats?.veiculosDisponiveis || 0}
          icon={Car}
          color="green"
          subtitle="prontos para locação"
          onClick={() => navigate('/veiculos?status=disponivel')}
        />
        <DashboardCard
          title="Veículos Locados"
          value={stats?.veiculosLocados || 0}
          icon={Users}
          color="yellow"
          subtitle="atualmente em uso"
          onClick={() => navigate('/veiculos?status=locado')}
        />
        <DashboardCard
          title="Receita do Mês"
          value={`R$ ${(stats?.receitaMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="purple"
          subtitle="faturamento atual"
        />
        <DashboardCard
          title="Saldo do Caixa"
          value={`R$ ${(stats?.saldoCaixa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="red"
          subtitle="disponível em caixa"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/clientes')}
            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-colors border border-blue-200 dark:border-blue-700"
          >
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Novo Cliente</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Cadastrar cliente</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/veiculos')}
            className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg hover:from-green-100 hover:to-green-200 dark:hover:from-green-800 dark:hover:to-green-700 transition-colors border border-green-200 dark:border-green-700"
          >
            <Car className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-green-900 dark:text-green-100">Novo Veículo</p>
              <p className="text-sm text-green-700 dark:text-green-300">Cadastrar veículo</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/locacoes')}
            className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800 dark:hover:to-purple-700 transition-colors border border-purple-200 dark:border-purple-700"
          >
            <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-purple-900 dark:text-purple-100">Nova Locação</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Criar contrato</p>
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Veículos Mais Locados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <Award className="h-6 w-6 text-yellow-500 mr-2" />
              Top Veículos Locados
            </h2>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          
          {loadingAdvanced ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {advancedStats?.veiculosMaisLocados?.slice(0, 5).map((item, index) => (
                <div key={item.veiculo.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-900/50 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {item.veiculo.marca} {item.veiculo.modelo}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.veiculo.ano} • {item.veiculo.placa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {item.totalLocacoes} locações
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      R$ {item.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Veículos com Maior Lucro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <DollarSign className="h-6 w-6 text-green-500 mr-2" />
              Maior Lucro
            </h2>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          
          {loadingAdvanced ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {advancedStats?.veiculosMaiorLucro?.slice(0, 5).map((item, index) => (
                <div key={item.veiculo.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 dark:bg-green-900/50 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {item.veiculo.marca} {item.veiculo.modelo}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.veiculo.ano} • {item.veiculo.placa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                      R$ {item.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.totalLocacoes} locações
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gráfico de Receita Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <BarChart3 className="h-6 w-6 text-purple-500 mr-2" />
              Receita Mensal
            </h2>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          
          {loadingAdvanced ? (
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : advancedStats?.receitaMensal?.length > 0 ? (
            <div className="h-48">
              <Line
                data={{
                  labels: advancedStats.receitaMensal.map(item => {
                    const [ano, mes] = item.mes.split('-');
                    return new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
                      month: 'short', 
                      year: '2-digit' 
                    });
                  }),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: advancedStats.receitaMensal.map(item => item.valor),
                      borderColor: 'rgb(147, 51, 234)',
                      backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgb(147, 51, 234)',
                      pointBorderColor: 'white',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'R$ ' + value.toLocaleString('pt-BR');
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhum dado de receita disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
