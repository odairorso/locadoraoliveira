import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iqjqjqjqjqjqjqjqjqjq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxanFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugVistorias() {
  try {
    console.log('🔍 Verificando vistorias no banco...');
    
    // Buscar todas as vistorias
    const { data: vistorias, error } = await supabase
      .from('vistorias')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar vistorias:', error);
      return;
    }
    
    console.log(`📊 Total de vistorias encontradas: ${vistorias?.length || 0}`);
    
    if (vistorias && vistorias.length > 0) {
      const entradas = vistorias.filter(v => v.tipo_vistoria === 'entrada');
      const saidas = vistorias.filter(v => v.tipo_vistoria === 'saida');
      
      console.log(`🟢 Vistorias de entrada: ${entradas.length}`);
      console.log(`🔴 Vistorias de saída: ${saidas.length}`);
      
      if (entradas.length > 0) {
        console.log('\n📝 Primeira vistoria de entrada:');
        console.log(JSON.stringify(entradas[0], null, 2));
      }
      
      if (saidas.length > 0) {
        console.log('\n📝 Primeira vistoria de saída:');
        console.log(JSON.stringify(saidas[0], null, 2));
      }
    } else {
      console.log('⚠️ Nenhuma vistoria encontrada no banco de dados!');
    }
    
    // Verificar locações ativas
    console.log('\n🚗 Verificando locações ativas...');
    const { data: locacoes, error: locacoesError } = await supabase
      .from('locacoes')
      .select('*')
      .eq('status', 'ativa');
    
    if (locacoesError) {
      console.error('❌ Erro ao buscar locações:', locacoesError);
    } else {
      console.log(`📊 Locações ativas: ${locacoes?.length || 0}`);
      if (locacoes && locacoes.length > 0) {
        console.log('Primeira locação ativa:', JSON.stringify(locacoes[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugVistorias();