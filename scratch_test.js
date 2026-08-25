import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing 1: locacoes count...');
  const res1 = await supabase.from('locacoes').select('*', { count: 'exact', head: true }).eq('status', 'ativa');
  console.log('res1:', res1);

  console.log('Testing 2: stats join...');
  const res2 = await supabase
    .from('locacoes')
    .select('veiculo_id, valor_total, veiculos(id, marca, modelo, ano, placa)')
    .not('veiculos', 'is', null);
  console.log('res2 error:', res2.error);
  console.log('res2 count:', res2.data ? res2.data.length : null);
}

test();
