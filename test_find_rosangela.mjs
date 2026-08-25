import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Vamos logar como odair para ter permissão de staff e ver todos os clientes
const supabase = createClient(url, anonKey);

async function findRosangela() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });

  const authClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`
      }
    }
  });

  console.log('Searching for Rosangela in clientes table...');
  const { data: clients } = await authClient
    .from('clientes')
    .select('id, nome, email, documento, celular')
    .ilike('nome', '%rosangela%');

  console.log('Results by nome:', clients);

  const { data: clientsByEmail } = await authClient
    .from('clientes')
    .select('id, nome, email, documento, celular')
    .ilike('email', '%turci%');

  console.log('Results by email turci:', clientsByEmail);
}

findRosangela();
