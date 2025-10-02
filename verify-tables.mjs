import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('🔍 Verificando estrutura das tabelas...\n');

  try {
    // Verificar estrutura das tabelas
    const { data: tableStructure, error: structureError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name IN ('clientes', 'veiculos', 'vistorias') 
          ORDER BY table_name, ordinal_position;
        `
      });

    if (structureError) {
      console.log('⚠️ Não foi possível usar RPC, tentando consulta direta...');
      
      // Tentar consulta direta nas tabelas
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .limit(1);

      const { data: veiculos, error: veiculosError } = await supabase
        .from('veiculos')
        .select('*')
        .limit(1);

      const { data: vistorias, error: vistoriasError } = await supabase
        .from('vistorias')
        .select('*')
        .limit(1);

      console.log('📊 Resultados das consultas diretas:');
      console.log('Clientes:', clientesError ? `❌ ${clientesError.message}` : `✅ ${clientes?.length || 0} registros`);
      console.log('Veículos:', veiculosError ? `❌ ${veiculosError.message}` : `✅ ${veiculos?.length || 0} registros`);
      console.log('Vistorias:', vistoriasError ? `❌ ${vistoriasError.message}` : `✅ ${vistorias?.length || 0} registros`);

      if (clientes && clientes.length > 0) {
        console.log('\n📋 Estrutura da tabela clientes (baseada no primeiro registro):');
        console.log(Object.keys(clientes[0]));
      }

      if (veiculos && veiculos.length > 0) {
        console.log('\n🚗 Estrutura da tabela veiculos (baseada no primeiro registro):');
        console.log(Object.keys(veiculos[0]));
      }

      if (vistorias && vistorias.length > 0) {
        console.log('\n🔍 Estrutura da tabela vistorias (baseada no primeiro registro):');
        console.log(Object.keys(vistorias[0]));
      }

    } else {
      console.log('📋 Estrutura das tabelas:');
      console.table(tableStructure);
    }

    // Contar registros
    console.log('\n📊 Contagem de registros:');
    
    const { count: clientesCount } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    const { count: veiculosCount } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true });

    const { count: vistoriasCount } = await supabase
      .from('vistorias')
      .select('*', { count: 'exact', head: true });

    console.log(`Clientes: ${clientesCount || 0}`);
    console.log(`Veículos: ${veiculosCount || 0}`);
    console.log(`Vistorias: ${vistoriasCount || 0}`);

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
  }
}

verifyTables();