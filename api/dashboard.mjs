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

  } catch (error) {
    console.error("Erro no dashboard:", error);
    response.status(500).json({
      success: false,
      error: "Erro interno do servidor ao carregar o dashboard.",
      details: error.message
    });
  }
}