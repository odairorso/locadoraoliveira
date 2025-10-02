import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEstrutura() {
  console.log('=== VERIFICANDO ESTRUTURA DA TABELA LOCAÇÕES ===');
  
  try {
    // Buscar uma locação para ver todas as colunas disponíveis
    const { data: locacoes, error } = await supabase
      .from('locacoes')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    if (locacoes && locacoes.length > 0) {
      console.log('\nColunas disponíveis na tabela locações:');
      Object.keys(locacoes[0]).forEach(coluna => {
        console.log(`- ${coluna}: ${locacoes[0][coluna]}`);
      });
    }
    
    // Agora buscar todas as locações no período com as colunas corretas
    console.log('\n=== LOCAÇÕES NO PERÍODO ===');
    
    const inicio = '2025-08-01';
    const fim = '2025-10-31';
    
    const { data: todasLocacoes, error: erro2 } = await supabase
      .from('locacoes')
      .select('*')
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim)
      .order('data_locacao', { ascending: true });
      
    if (erro2) {
      console.error('Erro 2:', erro2);
      return;
    }
    
    console.log(`\nTotal de locações no período: ${todasLocacoes?.length || 0}`);
    
    if (todasLocacoes && todasLocacoes.length > 0) {
      console.log('\nPrimeiras 5 locações:');
      todasLocacoes.slice(0, 5).forEach((loc, i) => {
        console.log(`${i + 1}:`, {
          id: loc.id,
          data_locacao: loc.data_locacao,
          data_inicio: loc.data_inicio,
          data_fim: loc.data_fim,
          status: loc.status
        });
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugEstrutura();