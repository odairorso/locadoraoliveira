import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkClient() {
  console.log('Checking client lanjaturcibinda@gmail.com in clientes table...');
  const { data: clients, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('email', '%lanjaturcibinda%');

  console.log('Result:', { clients, error });
}

checkClient();
