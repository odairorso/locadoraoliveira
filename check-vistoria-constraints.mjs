import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iqjqjqjqjqjqjqjqjqjq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxanFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  console.log('🔍 Verificando constraints da tabela vistorias...');
  
  try {
    // Verificar constraints da tabela vistorias
    const { data: constraints, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'vistorias'::regclass
          AND contype = 'c'
        `
      });
    
    if (error) {
      console.log('❌ Erro ao buscar constraints via RPC:', error);
      
      // Tentar uma abordagem alternativa - verificar vistorias existentes
      console.log('🔄 Tentando verificar valores existentes de nivel_combustivel...');
      
      const { data: vistorias, error: vistoriasError } = await supabase
        .from('vistorias')
        .select('nivel_combustivel')
        .not('nivel_combustivel', 'is', null);
      
      if (vistoriasError) {
        console.log('❌ Erro ao buscar vistorias:', vistoriasError);
      } else {
        console.log('📊 Valores existentes de nivel_combustivel:');
        const valores = [...new Set(vistorias.map(v => v.nivel_combustivel))];
        console.log(valores);
      }
      
    } else {
      console.log('✅ Constraints encontradas:');
      constraints.forEach(constraint => {
        console.log(`- ${constraint.constraint_name}: ${constraint.constraint_definition}`);
      });
    }
    
    // Tentar alguns valores diferentes para ver quais são aceitos
    console.log('\n🧪 Testando valores de combustível...');
    
    const valoresParaTestar = [
      'Vazio',
      'Reserva', 
      '1/4',
      '1/2',
      '3/4',
      'Cheio',
      'vazio',
      'reserva',
      'cheio'
    ];
    
    for (const valor of valoresParaTestar) {
      try {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .limit(1)
          .single();
          
        const { data: veiculo } = await supabase
          .from('veiculos')
          .select('id')
          .limit(1)
          .single();
        
        if (cliente && veiculo) {
          const testData = {
            cliente_id: cliente.id,
            veiculo_id: veiculo.id,
            tipo_vistoria: 'teste',
            data_vistoria: new Date().toISOString(),
            nivel_combustivel: valor,
            nome_condutor: 'Teste'
          };
          
          const { error: testError } = await supabase
            .from('vistorias')
            .insert([testData])
            .select();
          
          if (testError) {
            console.log(`❌ "${valor}": ${testError.message}`);
          } else {
            console.log(`✅ "${valor}": Aceito`);
            // Deletar o registro de teste
            await supabase
              .from('vistorias')
              .delete()
              .eq('tipo_vistoria', 'teste')
              .eq('nivel_combustivel', valor);
          }
        }
      } catch (e) {
        console.log(`❌ "${valor}": Erro no teste`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a verificação
checkConstraints();