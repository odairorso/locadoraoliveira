import { Car, Users, FileText, DollarSign, Wallet, Award, BarChart3, Shield, AlertTriangle, UserPlus, CarFront, FilePlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/react-app/components/DashboardCard';
import { useApi } from '@/react-app/hooks/useApi';
import { useAppTheme } from '@/react-app/contexts/ThemeContext';
import type { DashboardStats } from '@/shared/types';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/react-app/utils/formatters';

interface VeiculoRanking {
  veiculo: { id: string; marca: string; modelo: string; ano: number; placa: string };
  totalLocacoes: number;
  totalLucro: number;
}

interface AdvancedStats {
  veiculosMaisLocados?: VeiculoRanking[];
  veiculosMaiorLucro?: VeiculoRanking[];
  receitaMensal?: Array<{ mes: string; valor: number }>;
}

export default function Home() {
  const { data: stats } = useApi<DashboardStats>('/api/dashboard');
  const { data: advancedStats, loading: loadingAdvanced } = useApi<AdvancedStats>('/api/dashboard?tipo=stats');
  const { themeModel, setThemeModel } = useAppTheme();
  const navigate = useNavigate();

  const isGold = themeModel === 'gold_minimal';

  const currentStats: DashboardStats = stats || {
    locacoesAtivas: 0,
    veiculosDisponiveis: 0,
    veiculosLocados: 0,
    receitaMes: 0,
    receitaSeguro: 0,
    saldoCaixa: 0,
    locacoesVencidas: 0
  };

  return (
    <div className="space-y-5">
      {/* Seletor Rápido de Modelo Visual */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Escolher Modelo Visual do App:</span>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setThemeModel('gold_minimal')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              isGold
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-102 font-black'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🌟 Modelo 1: Dourado Minimalista</span>
          </button>
          <button
            onClick={() => setThemeModel('vibrant_multicolor')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              !isGold
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-102 font-black'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🌈 Modelo 2: Colorido Vibrante</span>
          </button>
        </div>
      </div>

      {/* 1. Header do Painel */}
      {isGold ? (
        // MODELO 1: DOURADO MINIMALISTA (Print 1)
        <div className="bg-[#10141d] rounded-2xl p-5 sm:p-6 border border-slate-800/80 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase block mb-1">
                PAINEL GERAL
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                Sistema Oliveira Veículos
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Gestão completa de locação e venda de veículos
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400">
              <p className="font-bold text-white">(67) 99622.9840</p>
              <p className="text-slate-400 text-[11px]">veiculos.oliveira@gmail.com</p>
            </div>
          </div>

          <div className="border-b-2 border-dashed border-amber-500/30 my-4" />

          {currentStats.locacoesVencidas > 0 ? (
            <div 
              onClick={() => navigate('/locacoes?status=vencida')}
              className="bg-[#161a22] border border-amber-500/80 rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-amber-950/30 transition-all shadow-lg active:scale-98 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                  !
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                    Há {currentStats.locacoesVencidas} {currentStats.locacoesVencidas === 1 ? 'locação vencida' : 'locações vencidas'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                    A data prevista de devolução expirou, mas os veículos ainda não foram marcados como devolvidos.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center flex-shrink-0 pl-2">
                Ver contratos →
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        // MODELO 2: COLORIDO VIBRANTE (Print 2 Original)
        <div className="space-y-4">
          <div className="text-center py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-slate-800">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sistema Oliveira Veículos
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Gestão completa de locação e venda de veículos
            </p>
            <p className="text-xs text-blue-400 font-semibold mt-1">
              Contato: (67) 99622.9840 | veiculos.oliveira@gmail.com
            </p>
          </div>

          {currentStats.locacoesVencidas > 0 ? (
            <div 
              onClick={() => navigate('/locacoes?status=vencida')}
              className="bg-[#1c1109] border border-amber-600/70 rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#25160b] transition-all shadow-lg active:scale-98 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                    Atenção: Há {currentStats.locacoesVencidas} {currentStats.locacoesVencidas === 1 ? 'locação vencida' : 'locações vencidas'}!
                  </p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    A data prevista de devolução expirou. Toque para ver os contratos.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center flex-shrink-0 pl-2">
                Ver Contratos →
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <DashboardCard
          title={isGold ? "LOCAÇÕES ATIVAS" : "Locações Ativas"}
          value={isGold ? String(currentStats.locacoesAtivas).padStart(2, '0') : currentStats.locacoesAtivas}
          icon={FileText}
          color={isGold ? "yellow" : "blue"}
          subtitle="contratos em andamento"
          onClick={() => navigate('/locacoes?status=ativa')}
        />
        <DashboardCard
          title={isGold ? "VEÍCULOS DISPONÍVEIS" : "Veículos Disponíveis"}
          value={isGold ? String(currentStats.veiculosDisponiveis).padStart(2, '0') : currentStats.veiculosDisponiveis}
          icon={Car}
          color="green"
          subtitle="prontos para locação"
          onClick={() => navigate('/veiculos?status=disponivel')}
        />
        <DashboardCard
          title={isGold ? "VEÍCULOS LOCADOS" : "Veículos Locados"}
          value={isGold ? String(currentStats.veiculosLocados).padStart(2, '0') : currentStats.veiculosLocados}
          icon={Users}
          color={isGold ? "blue" : "yellow"}
          subtitle="atualmente em uso"
          onClick={() => navigate('/veiculos?status=locado')}
        />
        <DashboardCard
          title={isGold ? "RECEITA DO MÊS" : "Receita do Mês"}
          value={formatCurrency(currentStats.receitaMes)}
          icon={DollarSign}
          color={isGold ? "green" : "purple"}
          subtitle="faturamento atual"
        />
        <DashboardCard
          title={isGold ? "RECEITA SEGUROS" : "Receita Seguros"}
          value={formatCurrency(currentStats.receitaSeguro)}
          icon={Shield}
          color={isGold ? "blue" : "cyan"}
          subtitle="seguros do mês"
        />
        <DashboardCard
          title={isGold ? "SALDO DO CAIXA" : "Saldo do Caixa"}
          value={formatCurrency(currentStats.saldoCaixa)}
          icon={Wallet}
          color={isGold ? "yellow" : "red"}
          subtitle="disponível em caixa"
        />
      </div>

      {/* 3. Ações Rápidas */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
          {isGold ? "AÇÕES RÁPIDAS" : "Ações Rápidas"}
        </p>
        
        {isGold ? (
          // MODELO 1: Dourado Minimalista (Print 1)
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => navigate('/clientes')}
              className="flex items-center p-3.5 bg-[#12161f] rounded-xl hover:bg-[#181e2b] transition-all border border-slate-800 hover:border-slate-700 active:scale-95 group text-left shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mr-3 flex-shrink-0">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Novo Cliente</p>
                <p className="text-[10px] text-slate-400">Cadastrar cliente</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/veiculos')}
              className="flex items-center p-3.5 bg-[#12161f] rounded-xl hover:bg-[#181e2b] transition-all border border-slate-800 hover:border-slate-700 active:scale-95 group text-left shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mr-3 flex-shrink-0">
                <CarFront className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Novo Veículo</p>
                <p className="text-[10px] text-slate-400">Cadastrar veículo</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/locacoes?action=new')}
              className="flex items-center p-3.5 bg-[#12161f] rounded-xl hover:bg-[#181e2b] transition-all border border-slate-800 hover:border-slate-700 active:scale-95 group text-left shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mr-3 flex-shrink-0">
                <FilePlus className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Nova Locação</p>
                <p className="text-[10px] text-slate-400">Criar contrato</p>
              </div>
            </button>
          </div>
        ) : (
          // MODELO 2: Colorido Vibrante (Print 2)
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => navigate('/clientes')}
              className="flex items-center p-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 text-left"
            >
              <div className="p-2 bg-white/10 rounded-lg mr-3 text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Novo Cliente</p>
                <p className="text-xs text-blue-100">Cadastrar cliente</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/veiculos')}
              className="flex items-center p-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/30 active:scale-95 text-left"
            >
              <div className="p-2 bg-white/10 rounded-lg mr-3 text-white">
                <CarFront className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Novo Veículo</p>
                <p className="text-xs text-emerald-100">Cadastrar veículo</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/locacoes?action=new')}
              className="flex items-center p-4 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-lg shadow-purple-900/30 active:scale-95 text-left"
            >
              <div className="p-2 bg-white/10 rounded-lg mr-3 text-white">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Nova Locação</p>
                <p className="text-xs text-purple-100">Criar contrato</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 4. 3 Painéis Inferiores (Top Veículos, Maior Lucro, Receita Mensal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* 1. Top Veículos Locados */}
        <div className="bg-[#12161f] border border-slate-800 rounded-xl p-4 shadow-xl">
          <h2 className="text-xs font-extrabold text-white flex items-center mb-3">
            <Award className={`h-4 w-4 ${isGold ? 'text-amber-500' : 'text-amber-400'} mr-1.5`} />
            Top Veículos Locados
          </h2>
          
          {loadingAdvanced ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse h-10 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(advancedStats?.veiculosMaisLocados || []).slice(0, 3).map((item: any, index: number) => (
                <div key={item.veiculo.id} className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-slate-800/80">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                      index === 0 ? (isGold ? 'bg-amber-500 text-black' : 'bg-amber-500 text-black') : 'bg-slate-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-xs truncate">
                        {item.veiculo.marca} {item.veiculo.modelo}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.veiculo.ano} • {item.veiculo.placa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className={`font-bold ${isGold ? 'text-amber-400' : 'text-blue-400'} text-xs`}>
                      R$ {item.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {item.totalLocacoes} locações
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Maior Lucro */}
        <div className="bg-[#12161f] border border-slate-800 rounded-xl p-4 shadow-xl">
          <h2 className="text-xs font-extrabold text-white flex items-center mb-3">
            <span className="text-emerald-400 font-bold mr-1.5">$</span>
            Maior Lucro
          </h2>
          
          {loadingAdvanced ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse h-10 bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(advancedStats?.veiculosMaiorLucro || []).slice(0, 3).map((item: any, index: number) => (
                <div key={item.veiculo.id} className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-slate-800/80">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                      index === 0 ? 'bg-emerald-500 text-black' : 'bg-slate-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-xs truncate">
                        {item.veiculo.marca} {item.veiculo.modelo}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.veiculo.ano} • {item.veiculo.placa}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="font-bold text-emerald-400 text-xs">
                      R$ {item.totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {item.totalLocacoes} locações
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Receita Mensal */}
        <div className="bg-[#12161f] border border-slate-800 rounded-xl p-4 shadow-xl">
          <h2 className="text-xs font-extrabold text-white flex items-center mb-3">
            <BarChart3 className={`h-4 w-4 ${isGold ? 'text-amber-500' : 'text-purple-400'} mr-1.5`} />
            Receita Mensal
          </h2>
          
          {loadingAdvanced ? (
            <div className="animate-pulse h-36 bg-slate-800 rounded-lg"></div>
          ) : (advancedStats as any)?.receitaMensal?.length > 0 ? (
            <div className="h-36">
              <Line
                data={{
                  labels: (advancedStats as any).receitaMensal.map((item: any) => {
                    const [ano, mes] = item.mes.split('-');
                    return new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
                      month: 'short', 
                      year: '2-digit' 
                    });
                  }),
                  datasets: [
                    {
                      label: 'Receita (R$)',
                      data: (advancedStats as any).receitaMensal.map((item: any) => item.valor),
                      borderColor: isGold ? '#f59e0b' : '#a855f7',
                      backgroundColor: isGold ? 'rgba(245, 158, 11, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.35,
                      pointBackgroundColor: isGold ? '#f59e0b' : '#a855f7',
                      pointBorderColor: '#12161f',
                      pointBorderWidth: 2,
                      pointRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: { color: '#64748b', font: { size: 9 } },
                      grid: { color: 'rgba(51, 65, 85, 0.15)' }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#64748b',
                        font: { size: 9 },
                        callback: function(value: any) {
                          return 'R$ ' + Number(value).toLocaleString('pt-BR');
                        },
                      },
                      grid: { color: 'rgba(51, 65, 85, 0.15)' }
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <BarChart3 className="h-6 w-6 mx-auto mb-1 opacity-40" />
              <p className="text-xs">Nenhum dado de receita</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
