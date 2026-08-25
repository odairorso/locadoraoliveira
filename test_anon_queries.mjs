import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
// Cliente anon SEM fazer login
const supabaseAnon = createClient(url, anonKey);

async function testAnon() {
  console.log('=== Testando queries SEM autenticação (anon) ===');
  const { data: loc, error: e1 } = await supabaseAnon.from('locacoes').select('count');
  console.log('Locacoes (anon):', loc, 'Error:', e1?.message);

  const { data: vei, error: e2 } = await supabaseAnon.from('veiculos').select('count');
  console.log('Veiculos (anon):', vei, 'Error:', e2?.message);

  const { data: mov, error: e3 } = await supabaseAnon.from('movimentacoes_financeiras').select('count');
  console.log('Movimentacoes (anon):', mov, 'Error:', e3?.message);
}

testAnon();
