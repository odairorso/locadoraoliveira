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
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({
        success: false,
        error: "As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram configuradas.",
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

    const currentMonth = new Date().toISOString().substring(0, 7);
    const { data: revenue } = await supabase
      .from('locacoes')
      .select('valor_total')
      .like('created_at', `${currentMonth}%`)
      .not('status', 'eq', 'cancelada');

    const totalRevenue = revenue ? revenue.reduce((acc, item) => acc + (item.valor_total || 0), 0) : 0;

    const { data: allRentals } = await supabase
      .from('locacoes')
      .select('valor_total, status')
      .in('status', ['ativa', 'finalizada']);

    const saldoCaixa = allRentals ? allRentals.reduce((acc, rental) => acc + (rental.valor_total || 0), 0) : 0;

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