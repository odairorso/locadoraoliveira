import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

// Cria o client SEM flowType pkce: este app usa signInWithPassword (email/senha),
// que não é OAuth. PKCE aqui quebra a renovação automática do token.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'oliveira-veiculos-app',
    },
  },
  realtime: {
    params: { eventsPerSecond: 1 },
  },
})

// Centraliza a renovação após uma mudança de rede. O refresh token só pode ser
// usado uma vez, portanto várias telas não devem tentar renová-lo em paralelo.
let reconnectPromise: Promise<boolean> | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function reconnectSupabaseAuth(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  if (reconnectPromise) return reconnectPromise;

  reconnectPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    for (const delay of [0, 1000, 3000]) {
      if (delay) await wait(delay);
      if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) return true;
    }
    return false;
  })().catch((error) => {
    console.warn('Não foi possível renovar a sessão após reconectar.', error);
    return false;
  }).finally(() => {
    reconnectPromise = null;
  });

  return reconnectPromise;
}
