exports.handler = async (event, context) => {
  try {
    // Por enquanto, retornar dados mock até o Supabase estar configurado
    const stats = {
      locacoesAtivas: 0,
      veiculosDisponiveis: 0,
      veiculosLocados: 0,
      receitaMes: 0
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: "Erro ao carregar dashboard"
      })
    };
  }
};

/* 
// Código com Supabase - descomentar quando o banco estiver configurado

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
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

    const totalRevenue = revenue ? revenue.reduce((acc, item) => acc + item.valor_total, 0) : 0;

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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: "Erro ao carregar dashboard"
      })
    };
  }
};
*/
