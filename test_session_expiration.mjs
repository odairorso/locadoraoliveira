import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function testSessionExpiration() {
  console.log('=== Testando login e verificando expires_at ===');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'odair.orso78@gmail.com',
    password: 'Oliveira@2026'
  });

  const session = data.session;
  console.log('Session expires_at (timestamp unix):', session.expires_at);
  console.log('Expires at date:', new Date(session.expires_at * 1000).toLocaleString());
  console.log('Current time date:', new Date().toLocaleString());
  console.log('Difference in seconds:', session.expires_at - Math.floor(Date.now() / 1000));
}

testSessionExpiration();
