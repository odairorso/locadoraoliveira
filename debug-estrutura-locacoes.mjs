import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstrutura() {
  console.log('🔍 Verificando estrutura da tabela locacoes...\n');

  try {
    // Buscar uma locação para ver a estrutura
    const { data: locacoes, error } = await supabase
      .from('locacoes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar locações:', error);
      return;
    }

    if (locacoes && locacoes.length > 0) {
      console.log('📋 Estrutura da tabela locacoes:');
      console.log('Colunas disponíveis:', Object.keys(locacoes[0]));
      console.log('\n📄 Exemplo de registro:');
      console.log(JSON.stringify(locacoes[0], null, 2));
    } else {
      console.log('❌ Nenhuma locação encontrada');
    }

    // Verificar também a estrutura da tabela clientes
    const { data: clientes, error: errorClientes } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);

    if (clientes && clientes.length > 0) {
      console.log('\n📋 Estrutura da tabela clientes:');
      console.log('Colunas disponíveis:', Object.keys(clientes[0]));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarEstrutura();