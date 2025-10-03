import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { supabase } from '@/react-app/supabase';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';

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

interface RelatorioFinanceiro {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
  locacoes_ativas: number;
}

interface RelatorioVeiculo {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  total_locacoes: number;
  receita_total: number;
  dias_locado: number;
  taxa_ocupacao: number;
}

interface RelatorioCliente {
  id: number;
  nome: string;
  cpf: string;
  celular: string;
  email: string;
  total_locacoes: number;
  valor_total_gasto: number;
  valor_medio_locacao: number;
  ultima_locacao: string;
  status_cliente: string;
}

interface RelatorioLocacao {
  id: number;
  cliente: string;
  veiculo: string;
  data_locacao: string;
  data_entrega: string;
  valor_total: number;
  status: string;
  dias_locacao: number;
  observacoes?: string;
}

interface EstatisticasClientes {
  total_clientes: number;
  clientes_ativos: number;
  clientes_inativos: number;
  receita_total: number;
  ticket_medio: number;
}

interface EstatisticasLocacoes {
  total_locacoes: number;
  valor_total_periodo: number;
  valor_medio_locacao: number;
  dias_medio_locacao: number;
  distribuicao_status: {
    ativa: number;
    finalizada: number;
    cancelada: number;
    pendente: number;
  };
  evolucao_mensal?: Array<{
    mes: string;
    total_locacoes: number;
    valor_total: number;
  }>;
}



export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<'financeiro' | 'veiculos' | 'clientes' | 'locacoes'>('financeiro');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  

  
  // Estados para dados dos relatórios
  const [dadosFinanceiro, setDadosFinanceiro] = useState<RelatorioFinanceiro[]>([]);
  const [dadosVeiculos, setDadosVeiculos] = useState<RelatorioVeiculo[]>([]);
  const [dadosClientes, setDadosClientes] = useState<RelatorioCliente[]>([]);
  const [dadosLocacoes, setDadosLocacoes] = useState<RelatorioLocacao[]>([]);
  const [estatisticasClientes, setEstatisticasClientes] = useState<EstatisticasClientes | null>(null);
  const [estatisticasLocacoes, setEstatisticasLocacoes] = useState<EstatisticasLocacoes | null>(null);
  
  // Estados para listas de filtros
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);



  // Definir período padrão (incluindo dados de teste em 2025)
  useEffect(() => {
    // Definir período que inclui os dados de teste em formato brasileiro
    setPeriodoInicio('01/01/2024');
    setPeriodoFim('31/12/2025');
  }, []);

  // Carregar listas para filtros
  useEffect(() => {
    const carregarFiltros = async () => {
      try {
        const [veiculosRes, clientesRes] = await Promise.all([
          fetch('/api/veiculos'),
          fetch('/api/clientes')
        ]);
        
        if (veiculosRes.ok) {
          const veiculosData = await veiculosRes.json();
          setVeiculos(veiculosData.data || []);
        }
        
        if (clientesRes.ok) {
          const clientesData = await clientesRes.json();
          setClientes(clientesData.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    };
    
    carregarFiltros();
  }, []);

  // Carregar relatório automaticamente quando as datas estiverem definidas
  useEffect(() => {
    if (periodoInicio && periodoFim) {
      gerarRelatorio();
    }
  }, [periodoInicio, periodoFim, tipoRelatorio]);

  const gerarRelatorio = async () => {
    if (!periodoInicio || !periodoFim) {
      alert('Por favor, selecione o período para o relatório');
      return;
    }

    setLoading(true);
    try {
      // Converter datas do formato brasileiro (dd/mm/yyyy) para formato da API (yyyy-mm-dd)
      const dataInicioAPI = formatDateFromInput(periodoInicio);
      const dataFimAPI = formatDateFromInput(periodoFim);
      
      let data;
      
      switch (tipoRelatorio) {
        case 'financeiro':
          data = await gerarRelatorioFinanceiro(dataInicioAPI, dataFimAPI);
          setDadosFinanceiro((data as RelatorioFinanceiro[]) || []);
          break;
        case 'veiculos':
          data = await gerarRelatorioVeiculos(dataInicioAPI, dataFimAPI, veiculoSelecionado);
          setDadosVeiculos(data || []);
          break;
        case 'clientes':
          data = await gerarRelatorioClientes(dataInicioAPI, dataFimAPI, clienteSelecionado);
          setDadosClientes(data?.data || []);
          setEstatisticasClientes(data?.estatisticas || {});
          break;
        case 'locacoes':
          data = await gerarRelatorioLocacoes(dataInicioAPI, dataFimAPI, veiculoSelecionado, clienteSelecionado);
          setDadosLocacoes(data?.data || []);
          setEstatisticasLocacoes(data?.estatisticas || {});
          break;
        default:
          throw new Error('Tipo de relatório não suportado');
      }
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar relatório financeiro usando Supabase
  const gerarRelatorioFinanceiro = async (dataInicio: string, dataFim: string) => {
    // Buscar movimentações financeiras
    const { data: movimentacoes, error: errorMov } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .gte('data_movimentacao', dataInicio)
      .lte('data_movimentacao', dataFim)
      .order('data_movimentacao', { ascending: false });

    if (errorMov) {
      throw new Error('Erro ao buscar dados financeiros: ' + errorMov.message);
    }

    // Buscar manutenções no mesmo período
    const { data: manutencoes, error: errorMan } = await supabase
      .from('manutencoes')
      .select('*')
      .gte('data_manutencao', dataInicio)
      .lte('data_manutencao', dataFim)
      .order('data_manutencao', { ascending: false });

    if (errorMan) {
      throw new Error('Erro ao buscar dados de manutenções: ' + errorMan.message);
    }

    // Agrupar movimentações financeiras por mês
    const dadosAgrupados = (movimentacoes || []).reduce((acc: any, mov: any) => {
      const mes = new Date(mov.data_movimentacao).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit' 
      });
      
      if (!acc[mes]) {
        acc[mes] = { mes, receitas: 0, despesas: 0, lucro: 0, locacoes_ativas: 0 };
      }
      
      if (mov.tipo === 'entrada') {
        acc[mes].receitas += parseFloat(mov.valor);
      } else {
        acc[mes].despesas += parseFloat(mov.valor);
      }
      
      return acc;
    }, {});

    // Adicionar manutenções como despesas
    (manutencoes || []).forEach((manutencao: any) => {
      const mes = new Date(manutencao.data_manutencao).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit' 
      });
      
      if (!dadosAgrupados[mes]) {
        dadosAgrupados[mes] = { mes, receitas: 0, despesas: 0, lucro: 0, locacoes_ativas: 0 };
      }
      
      dadosAgrupados[mes].despesas += parseFloat(manutencao.valor);
    });

    // Calcular lucro para todos os meses
    Object.values(dadosAgrupados).forEach((dados: any) => {
      dados.lucro = dados.receitas - dados.despesas;
    });

    return Object.values(dadosAgrupados);
  };

  // Função para gerar relatório de veículos usando Supabase
  const gerarRelatorioVeiculos = async (dataInicio: string, dataFim: string, veiculoId?: string) => {
    let query = supabase
      .from('veiculos')
      .select(`
        *,
        locacoes!inner(
          id,
          data_locacao,
          data_entrega,
          valor_total,
          status
        )
      `);

    if (veiculoId) {
      query = query.eq('id', veiculoId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Erro ao buscar dados de veículos: ' + error.message);
    }

    // Processar dados dos veículos
    return data.map((veiculo: any) => {
      const locacoes = veiculo.locacoes.filter((loc: any) => 
        loc.data_locacao >= dataInicio && loc.data_locacao <= dataFim
      );
      
      const totalLocacoes = locacoes.length;
      const receitaTotal = locacoes.reduce((sum: number, loc: any) => sum + parseFloat(loc.valor_total), 0);
      const diasLocado = locacoes.reduce((sum: number, loc: any) => {
        const inicio = new Date(loc.data_locacao);
        const fim = new Date(loc.data_entrega);
        return sum + Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      
      const diasPeriodo = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24));
      const taxaOcupacao = diasPeriodo > 0 ? (diasLocado / diasPeriodo) * 100 : 0;

      return {
        id: veiculo.id,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        placa: veiculo.placa,
        total_locacoes: totalLocacoes,
        receita_total: receitaTotal,
        dias_locado: diasLocado,
        taxa_ocupacao: taxaOcupacao
      };
    });
  };

  // Função para gerar relatório de clientes usando Supabase
  const gerarRelatorioClientes = async (dataInicio: string, dataFim: string, clienteId?: string) => {
    let query = supabase
      .from('clientes')
      .select(`
        *,
        locacoes(
          id,
          data_locacao,
          data_entrega,
          valor_total,
          status
        )
      `);

    if (clienteId) {
      query = query.eq('id', clienteId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Erro ao buscar dados de clientes: ' + error.message);
    }

    // Processar dados dos clientes
    const clientes = data.map((cliente: any) => {
      const locacoes = cliente.locacoes.filter((loc: any) => 
        loc.data_locacao >= dataInicio && loc.data_locacao <= dataFim
      );
      
      const totalLocacoes = locacoes.length;
      const valorTotalGasto = locacoes.reduce((sum: number, loc: any) => sum + parseFloat(loc.valor_total), 0);
      const valorMedioLocacao = totalLocacoes > 0 ? valorTotalGasto / totalLocacoes : 0;
      
      const ultimaLocacao = locacoes.length > 0 
        ? Math.max(...locacoes.map((loc: any) => new Date(loc.data_locacao).getTime()))
        : null;
      
      const statusCliente = ultimaLocacao && (Date.now() - ultimaLocacao) < (90 * 24 * 60 * 60 * 1000) 
        ? 'ativo' : 'inativo';

      return {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        celular: cliente.celular,
        email: cliente.email,
        total_locacoes: totalLocacoes,
        valor_total_gasto: valorTotalGasto,
        valor_medio_locacao: valorMedioLocacao,
        ultima_locacao: ultimaLocacao ? new Date(ultimaLocacao).toLocaleDateString('pt-BR') : 'Nunca',
        status_cliente: statusCliente
      };
    });

    // Calcular estatísticas
    const estatisticas = {
      total_clientes: clientes.length,
      clientes_ativos: clientes.filter(c => c.status_cliente === 'ativo').length,
      clientes_inativos: clientes.filter(c => c.status_cliente === 'inativo').length,
      receita_total: clientes.reduce((sum, c) => sum + c.valor_total_gasto, 0),
      ticket_medio: clientes.length > 0 ? clientes.reduce((sum, c) => sum + c.valor_medio_locacao, 0) / clientes.length : 0
    };

    return { data: clientes, estatisticas };
  };

  // Função para gerar relatório de locações usando Supabase
  const gerarRelatorioLocacoes = async (dataInicio: string, dataFim: string, veiculoId?: string, clienteId?: string) => {
    let query = supabase
      .from('locacoes')
      .select(`
        *,
        clientes(nome),
        veiculos(marca, modelo, placa)
      `)
      .gte('data_locacao', dataInicio)
      .lte('data_locacao', dataFim);

    if (veiculoId) {
      query = query.eq('veiculo_id', veiculoId);
    }
    
    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Erro ao buscar dados de locações: ' + error.message);
    }

    // Processar dados das locações
    const locacoes = data.map((locacao: any) => {
      const diasLocacao = Math.ceil(
        (new Date(locacao.data_entrega).getTime() - new Date(locacao.data_locacao).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: locacao.id,
        cliente: locacao.clientes?.nome || 'Cliente não encontrado',
        veiculo: `${locacao.veiculos?.marca} ${locacao.veiculos?.modelo} (${locacao.veiculos?.placa})`,
        data_locacao: new Date(locacao.data_locacao).toLocaleDateString('pt-BR'),
        data_entrega: new Date(locacao.data_entrega).toLocaleDateString('pt-BR'),
        valor_total: parseFloat(locacao.valor_total),
        status: locacao.status,
        dias_locacao: diasLocacao,
        observacoes: locacao.observacoes
      };
    });

    // Calcular estatísticas
    const estatisticas = {
      total_locacoes: locacoes.length,
      valor_total_periodo: locacoes.reduce((sum, loc) => sum + loc.valor_total, 0),
      valor_medio_locacao: locacoes.length > 0 ? locacoes.reduce((sum, loc) => sum + loc.valor_total, 0) / locacoes.length : 0,
      dias_medio_locacao: locacoes.length > 0 ? locacoes.reduce((sum, loc) => sum + loc.dias_locacao, 0) / locacoes.length : 0,
      distribuicao_status: {
        ativa: locacoes.filter(l => l.status === 'ativa').length,
        finalizada: locacoes.filter(l => l.status === 'finalizada').length,
        cancelada: locacoes.filter(l => l.status === 'cancelada').length,
        pendente: locacoes.filter(l => l.status === 'pendente').length
      }
    };

    return { data: locacoes, estatisticas };
  };



  const exportarRelatorio = () => {
    // Implementar exportação para CSV/PDF
    alert('Funcionalidade de exportação será implementada em breve');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Funções para formatação de datas brasileiras
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    // Se contiver uma barra, é uma data dd/mm/yyyy
    if (dateString.includes('/')) {
      return dateString;
    }
    // Se contiver um hífen, é uma data yyyy-mm-dd do estado
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    return dateString;
  };

  const formatDateFromInput = (dateString: string) => {
    if (!dateString) return '';
    // Convert from dd/mm/yyyy to yyyy-mm-dd for API
    const [day, month, year] = dateString.split('/');
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const handleDateChange = (value: string, setter: (value: string) => void) => {
    // Remove caracteres não numéricos exceto /
    let cleaned = value.replace(/[^\d/]/g, '');
    
    // Adiciona barras automaticamente
    if (cleaned.length >= 2 && !cleaned.includes('/')) {
      cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
      const parts = cleaned.split('/');
      cleaned = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
    }
    
    // Limita o tamanho
    if (cleaned.length <= 10) {
      setter(cleaned);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-400">Análise completa do desempenho do negócio</p>
          </div>
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="financeiro">Financeiro por Mês</option>
              <option value="veiculos">Performance de Veículos</option>
              <option value="clientes">Análise de Clientes</option>
              <option value="locacoes">Relatório de Locações</option>
            </select>
          </div>

          {/* Período Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Início
            </label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={formatDateForInput(periodoInicio)}
              onChange={(e) => handleDateChange(e.target.value, setPeriodoInicio)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={10}
            />
          </div>

          {/* Período Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Fim
            </label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={formatDateForInput(periodoFim)}
              onChange={(e) => handleDateChange(e.target.value, setPeriodoFim)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={10}
            />
          </div>

          {/* Filtro por Veículo */}
          {(tipoRelatorio === 'veiculos' || tipoRelatorio === 'locacoes') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Veículo (Opcional)
              </label>
              <select
                value={veiculoSelecionado}
                onChange={(e) => setVeiculoSelecionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os veículos</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Cliente */}
          {(tipoRelatorio === 'clientes' || tipoRelatorio === 'locacoes') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente (Opcional)
              </label>
              <select
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={gerarRelatorio}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner text="" />
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </button>
          
          <button
            onClick={exportarRelatorio}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Conteúdo dos Relatórios */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <LoadingSpinner text="Gerando relatório..." />
        </div>
      )}

      {/* Relatório Financeiro */}
      {!loading && tipoRelatorio === 'financeiro' && dadosFinanceiro.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolução Financeira
              </h3>
              <div className="h-80">
                <Line
                  data={{
                    labels: dadosFinanceiro.map(item => item.mes),
                    datasets: [
                      {
                        label: 'Receita',
                        data: dadosFinanceiro.map(item => item.receitas),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.1,
                      },
                      {
                        label: 'Despesas',
                        data: dadosFinanceiro.map(item => item.despesas),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.1,
                      },
                      {
                        label: 'Lucro',
                        data: dadosFinanceiro.map(item => item.lucro),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            }).format(value as number);
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Locações Ativas por Mês
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: dadosFinanceiro.map(item => item.mes),
                    datasets: [
                      {
                        label: 'Locações Ativas',
                        data: dadosFinanceiro.map(item => item.locacoes_ativas),
                        backgroundColor: 'rgba(147, 51, 234, 0.8)',
                        borderColor: 'rgb(147, 51, 234)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dados Detalhados
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Receitas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Despesas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lucro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Locações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosFinanceiro.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.mes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatarMoeda(item.receitas)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        {formatarMoeda(item.despesas)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`flex items-center ${item.lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.lucro >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          {formatarMoeda(item.lucro)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.locacoes_ativas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Relatório de Veículos */}
      {!loading && tipoRelatorio === 'veiculos' && dadosVeiculos.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Receita por Veículo
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: dadosVeiculos.map(v => `${v.marca} ${v.modelo} (${v.placa})`),
                    datasets: [
                      {
                        label: 'Receita Total',
                        data: dadosVeiculos.map(v => v.receita_total),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            }).format(value as number);
                          },
                        },
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Taxa de Ocupação
              </h3>
              <div className="h-80">
                <Doughnut
                  data={{
                    labels: dadosVeiculos.map(v => `${v.marca} ${v.modelo} (${v.placa})`),
                    datasets: [
                      {
                        label: 'Taxa de Ocupação (%)',
                        data: dadosVeiculos.map(v => v.taxa_ocupacao),
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(147, 51, 234, 0.8)',
                          'rgba(236, 72, 153, 0.8)',
                          'rgba(14, 165, 233, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                        ],
                        borderColor: [
                          'rgb(59, 130, 246)',
                          'rgb(34, 197, 94)',
                          'rgb(239, 68, 68)',
                          'rgb(245, 158, 11)',
                          'rgb(147, 51, 234)',
                          'rgb(236, 72, 153)',
                          'rgb(14, 165, 233)',
                          'rgb(34, 197, 94)',
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Detalhada de Veículos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Locações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Receita Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dias Locado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Taxa Ocupação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosVeiculos.map((veiculo) => (
                    <tr key={veiculo.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {veiculo.marca} {veiculo.modelo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {veiculo.placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {veiculo.total_locacoes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatarMoeda(veiculo.receita_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {veiculo.dias_locado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${veiculo.taxa_ocupacao}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{veiculo.taxa_ocupacao.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Relatório de Clientes */}
      {!loading && tipoRelatorio === 'clientes' && dadosClientes.length > 0 && (
        <div className="space-y-6">
          {estatisticasClientes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estatísticas de Clientes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Clientes</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estatisticasClientes.total_clientes}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Clientes Ativos</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{estatisticasClientes.clientes_ativos}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Ticket Médio</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatarMoeda(estatisticasClientes.ticket_medio)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Receita Total</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatarMoeda(estatisticasClientes.receita_total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top 10 Clientes por Valor Gasto
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: dadosClientes.slice(0, 10).map(c => c.nome.split(' ')[0]),
                    datasets: [
                      {
                        label: 'Valor Total Gasto (R$)',
                        data: dadosClientes.slice(0, 10).map(c => c.valor_total_gasto),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            }).format(value as number);
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Distribuição de Status dos Clientes
              </h3>
              <div className="h-80">
                <Doughnut
                  data={{
                    labels: ['Clientes Ativos', 'Clientes Inativos'],
                    datasets: [
                      {
                        label: 'Quantidade',
                        data: [
                          dadosClientes.filter(c => c.status_cliente === 'ativo').length,
                          dadosClientes.filter(c => c.status_cliente === 'inativo').length
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                        ],
                        borderColor: [
                          'rgb(34, 197, 94)',
                          'rgb(239, 68, 68)',
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = dadosClientes.length;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Análise Detalhada de Clientes
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Locações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor Total Gasto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Última Locação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosClientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.cpf}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div>{cliente.celular}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {cliente.total_locacoes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatarMoeda(cliente.valor_total_gasto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatarMoeda(cliente.valor_medio_locacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatarData(cliente.ultima_locacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.status_cliente === 'ativo' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {cliente.status_cliente}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Relatório de Locações */}
      {!loading && tipoRelatorio === 'locacoes' && dadosLocacoes.length > 0 && (
        <div className="space-y-6">
          {estatisticasLocacoes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estatísticas de Locações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Locações</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estatisticasLocacoes.total_locacoes}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Valor Total</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatarMoeda(estatisticasLocacoes.valor_total_periodo)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Valor Médio</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatarMoeda(estatisticasLocacoes.valor_medio_locacao)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Dias Médios</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {estatisticasLocacoes.dias_medio_locacao.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Ativas</span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {estatisticasLocacoes.distribuicao_status.ativa}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">Finalizadas</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {estatisticasLocacoes.distribuicao_status.finalizada}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">Canceladas</span>
                    <span className="text-lg font-bold text-red-700 dark:text-red-300">
                      {estatisticasLocacoes.distribuicao_status.cancelada}
                    </span>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pendentes</span>
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {estatisticasLocacoes.distribuicao_status.pendente}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de Locações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolução Mensal de Locações
              </h3>
              <div className="h-80">
                <Line
                  data={{
                    labels: estatisticasLocacoes?.evolucao_mensal?.map(item => item.mes) || [],
                    datasets: [
                      {
                        label: 'Quantidade de Locações',
                        data: estatisticasLocacoes?.evolucao_mensal?.map(item => item.total_locacoes) || [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1,
                      },
                      {
                        label: 'Valor Total (R$)',
                        data: estatisticasLocacoes?.evolucao_mensal?.map(item => item.valor_total / 1000) || [],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y1',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            if (context.datasetIndex === 1) {
                              return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0,
                              }).format((context.parsed.y || 0) * 1000)}`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        type: 'linear' as const,
                        display: true,
                        position: 'left' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Quantidade de Locações',
                        },
                      },
                      y1: {
                        type: 'linear' as const,
                        display: true,
                        position: 'right' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Valor Total (R$ mil)',
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Distribuição por Status
              </h3>
              <div className="h-80">
                <Doughnut
                  data={{
                    labels: ['Ativas', 'Finalizadas', 'Canceladas', 'Pendentes'],
                    datasets: [
                      {
                        label: 'Quantidade',
                        data: estatisticasLocacoes ? [
                          estatisticasLocacoes.distribuicao_status.ativa,
                          estatisticasLocacoes.distribuicao_status.finalizada,
                          estatisticasLocacoes.distribuicao_status.cancelada,
                          estatisticasLocacoes.distribuicao_status.pendente
                        ] : [],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                        ],
                        borderColor: [
                          'rgb(59, 130, 246)',
                          'rgb(34, 197, 94)',
                          'rgb(239, 68, 68)',
                          'rgb(245, 158, 11)',
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = estatisticasLocacoes?.total_locacoes || 0;
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalhes das Locações
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data Locação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dias
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosLocacoes.map((locacao) => (
                    <tr key={locacao.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {locacao.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {locacao.veiculo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatarData(locacao.data_locacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {locacao.data_entrega ? formatarData(locacao.data_entrega) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {locacao.dias_locacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatarMoeda(locacao.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          locacao.status === 'finalizada' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : locacao.status === 'ativa'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : locacao.status === 'cancelada'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        }`}>
                          {locacao.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {!loading && (
        (tipoRelatorio === 'financeiro' && dadosFinanceiro.length === 0) ||
        (tipoRelatorio === 'veiculos' && dadosVeiculos.length === 0) ||
        (tipoRelatorio === 'clientes' && dadosClientes.length === 0) ||
        (tipoRelatorio === 'locacoes' && dadosLocacoes.length === 0)
      ) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Clique em "Gerar Relatório" para visualizar os dados do período selecionado.
          </p>
        </div>
      )}
    </div>
  );
}