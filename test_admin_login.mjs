import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function testAdminLogin() {
  console.log('=== Testando login do Odair ===');
  const t0 = Date.now();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });
  console.log('Tempo:', Date.now() - t0, 'ms');
  console.log('User:', data?.user?.id, data?.user?.email);
  console.log('Session access_token exists:', !!data?.session?.access_token);
  console.log('Error:', error);

  if (data?.session) {
    console.log('\n=== Testando query do Dashboard com a sessao logada ===');
    const { data: locacoes, error: locError } = await supabase
      .from('locacoes')
      .select('*');
    console.log('Locacoes retornadas:', locacoes?.length, 'Error:', locError);

    const { data: veiculos, error: vError } = await supabase
      .from('veiculos')
      .select('*');
    console.log('Veiculos retornados:', veiculos?.length, 'Error:', vError);

    const { data: clientes, error: cError } = await supabase
      .from('clientes')
      .select('*');
    console.log('Clientes retornados:', clientes?.length, 'Error:', cError);
  }
}

testAdminLogin();
