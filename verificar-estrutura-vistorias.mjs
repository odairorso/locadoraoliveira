import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura da tabela vistorias...\n');
    
    // Buscar uma vistoria existente para ver a estrutura
    const { data: vistoria, error } = await supabase
      .from('vistorias')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar vistoria:', error);
      return;
    }

    if (vistoria) {
      console.log('✅ Estrutura da tabela vistorias:');
      console.log('Colunas encontradas:');
      
      Object.keys(vistoria).forEach((coluna, index) => {
        console.log(`   ${index + 1}. ${coluna}: ${typeof vistoria[coluna]} = ${vistoria[coluna]}`);
      });
    } else {
      console.log('❌ Nenhuma vistoria encontrada na tabela');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarEstrutura();