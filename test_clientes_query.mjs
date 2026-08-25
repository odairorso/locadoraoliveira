import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function testClientes() {
  await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });

  const { data, error } = await supabase.from('clientes').select('id, nome, cpf_cnpj, celular, email');
  console.log('Clientes error:', error);
  console.log('Clientes count:', data?.length);
}

testClientes();
