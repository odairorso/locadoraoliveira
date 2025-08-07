import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // --- DIAGNOSTIC LOGS ---
  console.log("--- DASHBOARD FUNCTION LOGS ---");
  console.log("SUPABASE_URL is set:", !!process.env.SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY is set:", !!process.env.SUPABASE_ANON_KEY);
  // ------------------------

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não foram configuradas no Netlify para o backend.",
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        }
      };
    }

    // Count active rentals
    const { count: activeRentals } = await supabase
      .from('locacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativa');

    // Count available vehicles
    const { count: availableVehicles } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel');

    // Count rented vehicles
    const { count: rentedVehicles } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'locado');

    // Calculate current month revenue
    const currentMonth = new Date().toISOString().substring(0, 7);
    const { data: revenue } = await supabase
      .from('locacoes')
      .select('valor_total')
      .like('created_at', `${currentMonth}%`)
      .not('status', 'eq', 'cancelada');

    const totalRevenue = revenue ? revenue.reduce((acc, item) => acc + (item.valor_total || 0), 0) : 0;

    const stats = {
      locacoesAtivas: activeRentals || 0,
      veiculosDisponiveis: availableVehicles || 0,
      veiculosLocados: rentedVehicles || 0,
      receitaMes: totalRevenue || 0
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        data: stats,
        error: null
      })
    };
  } catch (error) {
    console.error("Erro no dashboard:", error);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        error: "Erro interno do servidor ao carregar o dashboard.",
        details: error.message
      })
    };
  }
};
