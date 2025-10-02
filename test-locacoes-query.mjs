import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocacoesQuery() {
  console.log('=== TESTE DE CONSULTA DE LOCAÇÕES ===');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  const inicio = '2025-08-01';
  const fim = '2025-10-31';
  
  console.log('\nPeríodo:', inicio, 'a', fim);
  
  try {
    // Teste 1: Consulta simples de todas as locações
    console.log('\n1. Testando consulta de todas as locações...');
    const { data: todasLocacoes, error: erro1 } = await supabase
      .from('locacoes')
      .select('id, data_locacao, status');
      
    if (erro1) {
      console.error('Erro na consulta 1:', erro1);
      return;
    }
    
    console.log('Total de locações na base:', todasLocacoes?.length || 0);
    
    // Teste 2: Consulta com filtro de período
    console.log('\n2. Testando consulta com filtro de período...');
    const { data: locacoesPeriodo, error: erro2 } = await supabase
      .from('locacoes')
      .select('id, data_locacao, status')
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim)
      .order('data_locacao', { ascending: true });
      
    if (erro2) {
      console.error('Erro na consulta 2:', erro2);
      return;
    }
    
    console.log('Locações no período:', locacoesPeriodo?.length || 0);
    
    if (locacoesPeriodo && locacoesPeriodo.length > 0) {
      console.log('\nPrimeiras 5 locações do período:');
      locacoesPeriodo.slice(0, 5).forEach((loc, i) => {
        console.log(`${i + 1}:`, {
          id: loc.id,
          data: loc.data_locacao,
          status: loc.status
        });
      });
      
      // Agrupar por mês
      const porMes = {};
      locacoesPeriodo.forEach(locacao => {
        const data = new Date(locacao.data_locacao);
        const chave = data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0');
        
        if (!porMes[chave]) {
          porMes[chave] = 0;
        }
        porMes[chave]++;
      });
      
      console.log('\nLocações por mês:');
      Object.keys(porMes).sort().forEach(mes => {
        console.log(mes + ':', porMes[mes]);
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testLocacoesQuery();