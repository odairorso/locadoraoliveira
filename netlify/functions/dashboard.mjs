import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  try {
    // Usar variáveis de ambiente ou fallback para desenvolvimento local
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://uvqyxpwlgltnskjdbwzt.supabase.co";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0";

    console.log('Dashboard - Supabase URL:', supabaseUrl);
    console.log('Dashboard - Usando chave:', supabaseKey ? 'Configurada' : 'Não configurada');

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não foram configuradas.",
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

    // Calculate cash balance from real rental data
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