import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: este helper NÃO usa mais SUPABASE_SERVICE_ROLE_KEY.
// Service role ignora o RLS — nunca deve ser usada em handler público.
// A segurança é garantida pelo RLS do Supabase (papel anon/authenticated)
// com o JWT do usuário repassado no header Authorization.
export function getSupabaseClient(request) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const authHeader = request?.headers?.authorization || request?.headers?.Authorization;

  if (authHeader) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
  }

  return createClient(supabaseUrl, supabaseKey);
}
