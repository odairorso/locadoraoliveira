import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function testFullFlow() {
  console.log('1. Signing in as odair.orso78@gmail.com...');
  const t0 = Date.now();
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });
  console.log(`Auth took ${Date.now() - t0}ms. Session active:`, !!auth?.session);

  console.log('2. Querying dashboard tables with logged in client...');
  const [
    { data: locacoes, error: locErr },
    { data: veiculos, error: veicErr },
    { data: movs, error: movErr },
    { data: clientes, error: cliErr }
  ] = await Promise.all([
    supabase.from('locacoes').select('id, status'),
    supabase.from('veiculos').select('id, status'),
    supabase.from('movimentacoes_financeiras').select('id, valor, tipo'),
    supabase.from('clientes').select('id, nome')
  ]);

  console.log('Results with JWT:');
  console.log('- Locações count:', locacoes?.length, 'Error:', locErr);
  console.log('- Veículos count:', veiculos?.length, 'Error:', veicErr);
  console.log('- Movimentações count:', movs?.length, 'Error:', movErr);
  console.log('- Clientes count:', clientes?.length, 'Error:', cliErr);
}

testFullFlow();
