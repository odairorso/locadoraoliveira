import { createClient } from '@supabase/supabase-js';

// Vercel-compatible handler
export default async function handler(request, response) {
  // Set CORS headers for all responses

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({
        success: false,
        error: "Supabase URL and Anon Key must be defined in .env file",
        debug: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          env: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
        }
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
      error: "Erro interno do servidor ao carregar o dashboard."
    });
  }
}

function getLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function handleBasicStats(supabase, response) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const hojeStr = getLocalYmd(hoje);

  // Primeiro dia do mês atual, em data local (não UTC)
  const primeiroDiaMes = getLocalYmd(new Date(anoAtual, mesAtual, 1));

  // Executar todas as queries em paralelo para reduzir latência
  const [
    { count: activeRentals },
    { count: availableVehicles },
    { count: rentedVehicles },
    { count: expiredRentals },
    { data: movMes, error: movMesError },
    { data: movSaldo, error: movSaldoError },
    { data: manutencoes, error: manutencoesError }
  ] = await Promise.all([
    supabase.from('locacoes').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
    supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'disponivel'),
    supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'locado'),
    supabase.from('locacoes').select('*', { count: 'exact', head: true }).eq('status', 'ativa').lt('data_entrega', hojeStr),
    // Movimentações só do mês atual (para receita do mês)
    supabase.from('movimentacoes_financeiras')
      .select('tipo, valor, categoria')
      .eq('tipo', 'entrada')
      .gte('data_movimentacao', primeiroDiaMes),
    // Movimentações de todos os tempos (para saldo de caixa)
    supabase.from('movimentacoes_financeiras').select('tipo, valor'),
    supabase.from('manutencoes').select('valor'),
  ]);

  if (movMesError) throw movMesError;
  if (movSaldoError) throw movSaldoError;
  if (manutencoesError) throw manutencoesError;

  // Receita do mês (já filtrada no banco)
  const totalRevenue = (movMes || []).reduce((acc, mov) => acc + mov.valor, 0);
  const receitaSeguro = (movMes || [])
    .filter(mov => mov.categoria === 'seguro')
    .reduce((acc, mov) => acc + mov.valor, 0);

  // Saldo de caixa total
  const saldoMovimentacoes = (movSaldo || []).reduce((acc, mov) => {
    return mov.tipo === 'entrada' ? acc + mov.valor : acc - mov.valor;
  }, 0);
  const totalManutencoes = (manutencoes || []).reduce((acc, m) => acc + m.valor, 0);
  const saldoCaixa = saldoMovimentacoes - totalManutencoes;

  const stats = {
    locacoesAtivas: activeRentals || 0,
    veiculosDisponiveis: availableVehicles || 0,
    veiculosLocados: rentedVehicles || 0,
    receitaMes: totalRevenue || 0,
    receitaSeguro: receitaSeguro || 0,
    saldoCaixa: saldoCaixa || 0,
    locacoesVencidas: expiredRentals || 0
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
    .gte('data_movimentacao', getLocalYmd(new Date(new Date().getFullYear(), 0, 1)))
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