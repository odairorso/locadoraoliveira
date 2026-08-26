import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function inspectVistorias() {
  await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });

  const { data, error } = await supabase.from('vistorias').select('*').limit(1);
  console.log('Vistorias row:', data, 'Error:', error);
}

inspectVistorias();
