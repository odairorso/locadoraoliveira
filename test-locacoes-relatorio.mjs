import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocacoes() {
  console.log('🔍 Testando consulta de locações...\n');
  
  // Período de teste (últimos 6 meses)
  const dataFim = new Date().toISOString().split('T')[0];
  const dataInicio = new Date();
  dataInicio.setMonth(dataInicio.getMonth() - 6);
  const dataInicioStr = dataInicio.toISOString().split('T')[0];
  
  console.log(`📅 Período: ${dataInicioStr} até ${dataFim}\n`);
  
  // Buscar todas as locações
  const { data: todasLocacoes, error: errorTodas } = await supabase
    .from('locacoes')
    .select('id, data_locacao, data_entrega, status')
    .order('data_locacao', { ascending: false });
    
  if (errorTodas) {
    console.error('❌ Erro ao buscar todas as locações:', errorTodas);
    return;
  }
  
  console.log(`📊 Total de locações no banco: ${todasLocacoes?.length || 0}`);
  
  if (todasLocacoes && todasLocacoes.length > 0) {
    console.log('\n📋 Primeiras 5 locações:');
    todasLocacoes.slice(0, 5).forEach((loc, i) => {
      console.log(`${i + 1}. ID: ${loc.id}, Início: ${loc.data_locacao}, Fim: ${loc.data_entrega || 'Em andamento'}, Status: ${loc.status}`);
    });
  }
  
  // Buscar locações no período específico (método antigo)
  const { data: locacoesPeriodo, error: errorPeriodo } = await supabase
    .from('locacoes')
    .select('id, data_locacao, data_entrega, status')
    .gte('data_locacao', dataInicioStr)
    .lte('data_locacao', dataFim)
    .order('data_locacao', { ascending: true });
    
  if (errorPeriodo) {
    console.error('❌ Erro ao buscar locações do período:', errorPeriodo);
    return;
  }
  
  console.log(`\n🎯 Locações que começaram no período: ${locacoesPeriodo?.length || 0}`);
  
  // Buscar locações ativas no período (método novo)
  const { data: locacoesAtivas, error: errorAtivas } = await supabase
    .from('locacoes')
    .select('id, data_locacao, data_entrega, status')
    .or(`data_locacao.lte.${dataFim},and(data_entrega.gte.${dataInicioStr},data_entrega.is.null)`)
    .order('data_locacao', { ascending: true });
    
  if (errorAtivas) {
    console.error('❌ Erro ao buscar locações ativas:', errorAtivas);
    return;
  }
  
  console.log(`\n✅ Locações ativas no período: ${locacoesAtivas?.length || 0}`);
  
  if (locacoesAtivas && locacoesAtivas.length > 0) {
    console.log('\n📋 Locações ativas encontradas:');
    locacoesAtivas.forEach((loc, i) => {
      console.log(`${i + 1}. ID: ${loc.id}, Início: ${loc.data_locacao}, Fim: ${loc.data_entrega || 'Em andamento'}, Status: ${loc.status}`);
    });
  }
  
  // Testar período específico dos dados mostrados (08/2025 - 10/2025)
  console.log('\n🔍 Testando período específico: 08/2025 - 10/2025');
  const { data: locacoes2025, error: error2025 } = await supabase
    .from('locacoes')
    .select('id, data_locacao, data_entrega, status')
    .or(`data_locacao.lte.2025-10-31,and(data_entrega.gte.2025-08-01,data_entrega.is.null)`)
    .order('data_locacao', { ascending: true });
    
  if (error2025) {
    console.error('❌ Erro ao buscar locações 2025:', error2025);
    return;
  }
  
  console.log(`📊 Locações ativas em 08-10/2025: ${locacoes2025?.length || 0}`);
  
  if (locacoes2025 && locacoes2025.length > 0) {
    console.log('\n📋 Locações encontradas em 2025:');
    locacoes2025.forEach((loc, i) => {
      console.log(`${i + 1}. ID: ${loc.id}, Início: ${loc.data_locacao}, Fim: ${loc.data_entrega || 'Em andamento'}, Status: ${loc.status}`);
    });
  }
}

testLocacoes().catch(console.error);