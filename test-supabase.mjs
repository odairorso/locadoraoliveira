import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('\n=== Testando conexão com Supabase ===');
    
    // Busca todas as locações
    const { data: locacoes, error } = await supabase
      .from('locacoes')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar locações:', error);
      return;
    }
    
    console.log('\n=== Locações encontradas ===');
    console.log('Total:', locacoes?.length || 0);
    
    if (locacoes && locacoes.length > 0) {
      locacoes.forEach((locacao, index) => {
        console.log(`\nLocação ${index + 1}:`);
        console.log('ID:', locacao.id);
        console.log('Cliente ID:', locacao.cliente_id);
        console.log('Veículo ID:', locacao.veiculo_id);
        console.log('Status:', locacao.status);
      });
    } else {
      console.log('Nenhuma locação encontrada');
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testSupabase();