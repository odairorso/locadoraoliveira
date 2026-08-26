import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function test() {
  console.log('=== Testando login da Rosangela ===');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'lanjaturcibinda@gmail.com',
    password: process.env.TEST_CLIENT_PASSWORD || ''
  });
  console.log('SignIn result - user:', data?.user?.email, '| error:', error?.message);

  if (error) {
    console.log('\n=== Conta nao existe, criando agora... ===');
    const { data: d2, error: e2 } = await supabase.auth.signUp({
      email: 'lanjaturcibinda@gmail.com',
      password: process.env.TEST_CLIENT_PASSWORD || '',
      options: { data: { name: 'Rosângela Turci Binda', phone: '(67) 99900-9197' } }
    });
    console.log('SignUp result - user:', d2?.user?.email, '| error:', e2?.message);

    if (!e2 && d2?.user) {
      console.log('\n=== Testando login apos criacao ===');
      const { data: d3, error: e3 } = await supabase.auth.signInWithPassword({
        email: 'lanjaturcibinda@gmail.com',
        password: process.env.TEST_CLIENT_PASSWORD || ''
      });
      console.log('Login result - user:', d3?.user?.email, '| error:', e3?.message);
    }
  }
}

test();
