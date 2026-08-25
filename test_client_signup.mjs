import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function testClientLogin() {
  console.log('--- TEST: Trying signUp for lanjaturcibinda@gmail.com with 123456 ---');
  const res = await supabase.auth.signUp({
    email: 'lanjaturcibinda@gmail.com',
    password: '123456',
    options: {
      data: {
        name: 'Rosângela Turci Binda',
        phone: '(67) 99900-9197'
      }
    }
  });

  console.log('SignUp result:', res);

  console.log('\n--- TEST: Trying signInWithPassword for lanjaturcibinda@gmail.com with 123456 ---');
  const loginRes = await supabase.auth.signInWithPassword({
    email: 'lanjaturcibinda@gmail.com',
    password: '123456'
  });

  console.log('SignIn result:', loginRes);
}

testClientLogin();
