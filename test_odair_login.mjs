import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function test() {
  console.log('--- TEST 1: Logging in as odair.orso78@gmail.com ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });
  console.log('Auth result:', { user: authData?.user?.email, error: authError });

  if (authData?.session) {
    console.log('\n--- TEST 2: Querying perfis with authenticated client ---');
    const authClient = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    const { data: perfil, error: perfilError } = await authClient
      .from('perfis')
      .select('*')
      .eq('email', 'odair.orso78@gmail.com');
    console.log('Perfil result:', { perfil, perfilError });

    console.log('\n--- TEST 3: Querying dashboard stats with authenticated client ---');
    const { data: veiculos, count: countVeiculos } = await authClient
      .from('veiculos')
      .select('id, status', { count: 'exact' });
    console.log('Veiculos count:', countVeiculos, 'sample:', veiculos?.slice(0, 2));
  }
}

test();
