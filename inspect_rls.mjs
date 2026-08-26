import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function inspectRLS() {
  console.log('=== Testando Acesso sem Login (Anon) vs Com Login (Auth) ===');

  const { data: dAnonLoc, error: eAnonLoc } = await supabase.from('locacoes').select('id');
  console.log('Locacoes Anon:', dAnonLoc?.length, 'Error:', eAnonLoc?.message);

  const { data: dAnonVei, error: eAnonVei } = await supabase.from('veiculos').select('id');
  console.log('Veiculos Anon:', dAnonVei?.length, 'Error:', eAnonVei?.message);

  const { data: dAnonCli, error: eAnonCli } = await supabase.from('clientes').select('id');
  console.log('Clientes Anon:', dAnonCli?.length, 'Error:', eAnonCli?.message);

  const { data: dAnonMov, error: eAnonMov } = await supabase.from('movimentacoes_financeiras').select('id');
  console.log('Movimentacoes Anon:', dAnonMov?.length, 'Error:', eAnonMov?.message);

  console.log('\n--- Fazendo Login Admin ---');
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });
  console.log('Login Admin Sucesso:', !!loginData?.session, 'Error:', loginErr?.message);

  const { data: dAuthLoc } = await supabase.from('locacoes').select('id');
  console.log('Locacoes Auth:', dAuthLoc?.length);

  const { data: dAuthCli } = await supabase.from('clientes').select('id');
  console.log('Clientes Auth:', dAuthCli?.length);

  const { data: dAuthMov } = await supabase.from('movimentacoes_financeiras').select('id');
  console.log('Movimentacoes Auth:', dAuthMov?.length);
}

inspectRLS();
