import { Car, Users, FileText, DollarSign, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router';
import DashboardCard from '@/react-app/components/DashboardCard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { useApi } from '@/react-app/hooks/useApi';
import type { DashboardStats } from '@/shared/types';

export default function Home() {
  const { data: stats, loading, error } = useApi<DashboardStats>('/api/dashboard');
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
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <img
            src="https://mocha-cdn.com/01988471-cbda-7e3e-9eda-75676806ade8/ChatGPT-Image-6-de-ago.-de-2025,-07_.png"
            alt="Oliveira Veículos"
            className="h-32 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold">Sistema Oliveira Veículos</h1>
            <p className="text-blue-100 mt-2">
              Gestão completa de locação e venda de veículos
            </p>
            <p className="text-blue-200 text-sm mt-1">
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
        />
        <DashboardCard
          title="Veículos Disponíveis"
          value={stats?.veiculosDisponiveis || 0}
          icon={Car}
          color="green"
          subtitle="prontos para locação"
        />
        <DashboardCard
          title="Veículos Locados"
          value={stats?.veiculosLocados || 0}
          icon={Users}
          color="yellow"
          subtitle="atualmente em uso"
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

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Atividade Recente</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma atividade recente encontrada</p>
          <p className="text-sm">As locações e vendas aparecerão aqui</p>
        </div>
      </div>
    </div>
  );
}
