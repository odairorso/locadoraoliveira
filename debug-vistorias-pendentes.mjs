import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando vistorias recentes...');

const { data: vistorias, error } = await supabase
  .from('vistorias')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(15);

if (error) {
  console.error('Erro:', error);
} else {
  console.log('📋 Últimas 15 vistorias:');
  vistorias.forEach((v, i) => {
    console.log(`${i+1}. ID: ${v.id} | Tipo: ${v.tipo_vistoria} | Placa: ${v.placa} | Vistoriador: ${v.nome_vistoriador} | Data: ${v.created_at}`);
  });
  
  console.log('\n🔍 Vistorias pendentes (nome_vistoriador = Sistema):');
  const pendentes = vistorias.filter(v => v.nome_vistoriador === 'Sistema');
  if (pendentes.length === 0) {
    console.log('❌ Nenhuma vistoria pendente encontrada!');
  } else {
    pendentes.forEach((v, i) => {
      console.log(`${i+1}. ID: ${v.id} | Tipo: ${v.tipo_vistoria} | Placa: ${v.placa} | Data: ${v.created_at}`);
    });
  }
  
  console.log('\n🔍 Vistorias de entrada recentes:');
  const entradas = vistorias.filter(v => v.tipo_vistoria === 'entrada');
  entradas.forEach((v, i) => {
    console.log(`${i+1}. ID: ${v.id} | Placa: ${v.placa} | Vistoriador: ${v.nome_vistoriador} | Data: ${v.created_at}`);
  });
}