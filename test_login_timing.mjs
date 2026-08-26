import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function test() {
  console.log('Testing login with ricardo.oliveiraveiculos@gmai...');
  const t0 = Date.now();
  const res1 = await supabase.auth.signInWithPassword({
    email: 'ricardo.oliveiraveiculos@gmai',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });
  console.log('Result @gmai in', Date.now() - t0, 'ms:', res1);

  console.log('\nTesting login with ricardo.oliveiraveiculos@gmail.com...');
  const t1 = Date.now();
  const res2 = await supabase.auth.signInWithPassword({
    email: 'ricardo.oliveiraveiculos@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || ''
  });
  console.log('Result @gmail.com in', Date.now() - t1, 'ms:', res2.data ? 'SUCCESS' : res2.error);
}

test();
