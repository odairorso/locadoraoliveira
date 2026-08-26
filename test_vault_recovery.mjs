import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function testBulletproofSession() {
  console.log('=== 1. Testando login inicial ===');
  const { data: s1, error: e1 } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });
  console.log('Login 1:', !!s1?.session, e1?.message);

  console.log('=== 2. Simulando perda de sessao / signOut ===');
  await supabase.auth.signOut();
  const { data: sNull } = await supabase.auth.getSession();
  console.log('Sessao apos signOut (esperado null):', sNull?.session);

  console.log('=== 3. Auto-reconexao com credenciais do Vault ===');
  const vault = { email: 'odair.orso78@gmail.com', pass: process.env.TEST_ADMIN_PASSWORD || '' };
  const { data: sRecover, error: eRecover } = await supabase.auth.signInWithPassword({
    email: vault.email,
    password: vault.pass
  });
  console.log('Recuperacao automatica bem-sucedida:', !!sRecover?.session, eRecover?.message);

  console.log('=== 4. Testando query do Dashboard apos auto-recuperacao ===');
  const { data: locs } = await supabase.from('locacoes').select('id');
  console.log('Locacoes recuperadas com sucesso:', locs?.length);
}

testBulletproofSession();
