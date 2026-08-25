import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function inspectTables() {
  await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });

  console.log('=== Inspecionando 1 registro da tabela clientes ===');
  const { data: cData, error: cErr } = await supabase.from('clientes').select('*').limit(1);
  console.log('Clientes row:', cData, 'Error:', cErr);

  console.log('\n=== Inspecionando 1 registro da tabela locacoes ===');
  const { data: lData, error: lErr } = await supabase.from('locacoes').select('*').limit(1);
  console.log('Locacoes row:', lData, 'Error:', lErr);

  console.log('\n=== Inspecionando 1 registro da tabela perfis ===');
  const { data: pData, error: pErr } = await supabase.from('perfis').select('*').limit(1);
  console.log('Perfis row:', pData, 'Error:', pErr);

  console.log('\n=== Inspecionando 1 registro da tabela veiculos ===');
  const { data: vData, error: vErr } = await supabase.from('veiculos').select('*').limit(1);
  console.log('Veiculos row:', vData, 'Error:', vErr);
}

inspectTables();
