import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function inspectVistoriasKeys() {
  await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });

  const { data, error } = await supabase.from('vistorias').select('*').limit(1);
  if (data && data[0]) {
    console.log('Colunas de vistorias:', Object.keys(data[0]));
  } else {
    console.log('Sem registros em vistorias ou error:', error);
  }
}

inspectVistoriasKeys();
