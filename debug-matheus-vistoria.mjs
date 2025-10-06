import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarVistoriasMatheus() {
  try {
    console.log('🔍 Verificando vistorias do Matheus...\n');
    
    // Buscar todas as vistorias que contenham "Matheus" no nome do condutor
    const { data: vistorias, error } = await supabase
      .from('vistorias')
      .select('*')
      .ilike('nome_condutor', '%matheus%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vistorias:', error);
      return;
    }

    if (!vistorias || vistorias.length === 0) {
      console.log('❌ Nenhuma vistoria encontrada para Matheus');
      return;
    }

    console.log(`✅ Encontradas ${vistorias.length} vistoria(s) para Matheus:\n`);

    vistorias.forEach((vistoria, index) => {
      console.log(`--- Vistoria ${index + 1} ---`);
      console.log(`ID: ${vistoria.id}`);
      console.log(`Tipo: ${vistoria.tipo_vistoria}`);
      console.log(`Nome Condutor: ${vistoria.nome_condutor}`);
      console.log(`Nome Vistoriador: ${vistoria.nome_vistoriador}`);
      console.log(`Placa: ${vistoria.placa}`);
      console.log(`Locação ID: ${vistoria.locacao_id}`);
      console.log(`Data: ${vistoria.created_at}`);
      console.log(`Status: ${vistoria.nome_vistoriador === 'Sistema' ? 'PENDENTE' : 'FINALIZADA'}`);
      console.log('');
    });

    // Verificar se há vistorias pendentes (Sistema)
    const pendentes = vistorias.filter(v => v.nome_vistoriador === 'Sistema');
    const finalizadas = vistorias.filter(v => v.nome_vistoriador !== 'Sistema');

    console.log(`📊 Resumo:`);
    console.log(`   Pendentes: ${pendentes.length}`);
    console.log(`   Finalizadas: ${finalizadas.length}`);

    if (pendentes.length > 0) {
      console.log('\n🟡 Vistorias PENDENTES:');
      pendentes.forEach(v => {
        console.log(`   - ${v.tipo_vistoria.toUpperCase()} | ${v.placa} | ID: ${v.id}`);
      });
    }

    if (finalizadas.length > 0) {
      console.log('\n🟢 Vistorias FINALIZADAS:');
      finalizadas.forEach(v => {
        console.log(`   - ${v.tipo_vistoria.toUpperCase()} | ${v.placa} | ID: ${v.id} | Vistoriador: ${v.nome_vistoriador}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarVistoriasMatheus();