import { createClient } from '@supabase/supabase-js';

// Vercel-compatible handler
export default async function handler(request, response) {
  // Set CORS headers for all responses
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({
        success: false,
        error: "As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não foram configuradas.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { tipo } = request.query;

    if (tipo === 'stats') {
      return await handleAdvancedStats(supabase, response);
    } else {
      return await handleBasicStats(supabase, response);
    }

  } catch (error) {
    console.error("Erro no dashboard:", error);
    response.status(500).json({
      success: false,
      error: "Erro interno do servidor ao carregar o dashboard.",
      details: error.message
    });
  }
}

async function handleBasicStats(supabase, response) {
  const { count: activeRentals } = await supabase
    .from('locacoes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativa');

  const { count: availableVehicles } = await supabase
    .from('veiculos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'disponivel');

  const { count: rentedVehicles } = await supabase
    .from('veiculos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'locado');

  // Busca todas as movimentações para calcular a receita e o saldo de caixa manualmente
  const { data: movimentacoes, error: movimentacoesError } = await supabase
    .from('movimentacoes_financeiras')
    .select('tipo, valor, data_movimentacao');

  if (movimentacoesError) {
    console.error('Erro ao buscar movimentações financeiras:', movimentacoesError);
    throw movimentacoesError;
  }

  // Busca todas as manutenções para incluir no cálculo do saldo
  const { data: manutencoes, error: manutencoesError } = await supabase
    .from('manutencoes')
    .select('valor, data_manutencao');

  if (manutencoesError) {
    console.error('Erro ao buscar manutenções:', manutencoesError);
    throw manutencoesError;
  }

  // Calcula o saldo de caixa total (incluindo manutenções como despesas)
  const saldoMovimentacoes = movimentacoes.reduce((acc, mov) => {
    if (mov.tipo === 'entrada') {
      return acc + mov.valor;
    } else if (mov.tipo === 'saida') {
      return acc - mov.valor;
    }
    return acc;
  }, 0);

  // Subtrai o total de manutenções do saldo
  const totalManutencoes = manutencoes.reduce((acc, manutencao) => acc + manutencao.valor, 0);
  const saldoCaixa = saldoMovimentacoes - totalManutencoes;

  // Calcula a receita do mês atual
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  const totalRevenue = movimentacoes
    .filter(mov => {
      const dataMov = new Date(mov.data_movimentacao);
      return (
        mov.tipo === 'entrada' &&
        dataMov.getFullYear() === anoAtual &&
        dataMov.getMonth() === mesAtual
      );
    })
    .reduce((acc, mov) => acc + mov.valor, 0);

  const stats = {
    locacoesAtivas: activeRentals || 0,
    veiculosDisponiveis: availableVehicles || 0,
    veiculosLocados: rentedVehicles || 0,
    receitaMes: totalRevenue || 0,
    saldoCaixa: saldoCaixa || 0
  };

  response.status(200).json({
    success: true,
    data: stats,
    error: null
  });
}

async function handleAdvancedStats(supabase, response) {
  // Buscar veículos mais locados
  const { data: veiculosLocacoes, error: veiculosError } = await supabase
    .from('locacoes')
    .select(`
      veiculo_id,
      valor_total,
      veiculos (
        id,
        marca,
        modelo,
        ano,
        placa
      )
    `)
    .not('veiculos', 'is', null);

  if (veiculosError) {
    console.error('Erro ao buscar veículos e locações:', veiculosError);
    throw veiculosError;
  }

  // Processar dados para obter veículos mais locados
  const veiculosStats = {};
  
  veiculosLocacoes.forEach(locacao => {
    if (locacao.veiculos) {
      const veiculoId = locacao.veiculo_id;
      if (!veiculosStats[veiculoId]) {
        veiculosStats[veiculoId] = {
          veiculo: locacao.veiculos,
          totalLocacoes: 0,
          totalLucro: 0
        };
      }
      veiculosStats[veiculoId].totalLocacoes += 1;
      veiculosStats[veiculoId].totalLucro += locacao.valor_total || 0;
    }
  });

  // Converter para array e ordenar
  const veiculosArray = Object.values(veiculosStats);
  
  // Top 5 veículos mais locados
  const veiculosMaisLocados = veiculosArray
    .sort((a, b) => b.totalLocacoes - a.totalLocacoes)
    .slice(0, 5)
    .map(item => ({
      veiculo: item.veiculo,
      totalLocacoes: item.totalLocacoes,
      totalLucro: item.totalLucro
    }));

  // Top 5 veículos com maior lucro
  const veiculosMaiorLucro = veiculosArray
    .sort((a, b) => b.totalLucro - a.totalLucro)
    .slice(0, 5)
    .map(item => ({
      veiculo: item.veiculo,
      totalLocacoes: item.totalLocacoes,
      totalLucro: item.totalLucro
    }));

  // Buscar dados de receita por mês para gráfico
  const { data: movimentacoes, error: movError } = await supabase
    .from('movimentacoes_financeiras')
    .select('tipo, valor, data_movimentacao')
    .eq('tipo', 'entrada')
    .gte('data_movimentacao', new Date(new Date().getFullYear(), 0, 1).toISOString())
    .order('data_movimentacao', { ascending: true });

  if (movError) {
    console.error('Erro ao buscar movimentações:', movError);
    throw movError;
  }

  // Processar receita por mês
  const receitaPorMes = {};
  movimentacoes.forEach(mov => {
    const data = new Date(mov.data_movimentacao);
    const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    
    if (!receitaPorMes[mesAno]) {
      receitaPorMes[mesAno] = 0;
    }
    receitaPorMes[mesAno] += mov.valor;
  });

  const receitaMensal = Object.entries(receitaPorMes)
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const stats = {
    veiculosMaisLocados,
    veiculosMaiorLucro,
    receitaMensal
  };

  response.status(200).json({
    success: true,
    data: stats,
    error: null
  });
}