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

    // Chamar a função de RPC para a receita do mês
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const { data: receitaData, error: receitaError } = await supabase
      .rpc('get_receita_mes', { month_text: currentMonthStr })
      .single();
    if (receitaError) {
      console.error('Erro ao buscar receita do mês:', receitaError);
      throw receitaError;
    }
    const totalRevenue = receitaData.total || 0;

    // Chamar a função de RPC para o saldo de caixa
    const { data: saldoData, error: saldoError } = await supabase
      .rpc('get_saldo_caixa')
      .single();
    if (saldoError) {
      console.error('Erro ao buscar saldo de caixa:', saldoError);
      throw saldoError;
    }
    const saldoCaixa = saldoData.total || 0;

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