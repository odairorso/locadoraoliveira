import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const handler = async (event, context) => {
  try {
    const supabaseUrl = "https://uvqyxpwlgltnskjdbwzt.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRidzciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzE4Mjk1MiwiZXhwIjoyMDMyNzU4OTUyfQ.o-f-cczSVbYq_i3JjO2J4i_Jb2H3y_t2aYgB5g5f5aY";

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