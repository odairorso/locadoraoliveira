import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReceitaSeguros() {
  console.log('🔍 Verificando locações ativas com seguro...\n');

  try {
    // Buscar todas as locações ativas
    const { data: locacoes, error } = await supabase
      .from('locacoes')
      .select(`
        id,
        data_locacao,
        data_entrega,
        valor_seguro,
        status,
        cliente_id,
        clientes (
          id,
          nome
        )
      `)
      .eq('status', 'ativa')
      .order('data_locacao', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar locações:', error);
      return;
    }

    console.log(`📊 Total de locações ativas: ${locacoes.length}\n`);

    // Filtrar locações com seguro
    const locacoesComSeguro = locacoes.filter(loc => 
      loc.valor_seguro && parseFloat(loc.valor_seguro) > 0
    );

    console.log(`🛡️ Locações ativas com seguro: ${locacoesComSeguro.length}\n`);

    // Agrupar por cliente
    const clientesComSeguro = {};
    locacoesComSeguro.forEach(loc => {
      const clienteNome = loc.clientes?.nome || 'Cliente não encontrado';
      if (!clientesComSeguro[clienteNome]) {
        clientesComSeguro[clienteNome] = {
          cliente_id: loc.cliente_id,
          locacoes: [],
          total_seguro: 0
        };
      }
      clientesComSeguro[clienteNome].locacoes.push(loc);
      clientesComSeguro[clienteNome].total_seguro += parseFloat(loc.valor_seguro || 0);
    });

    console.log('👥 Clientes com locações ativas e seguro:');
    console.log('='.repeat(50));
    
    Object.entries(clientesComSeguro).forEach(([nome, dados]) => {
      console.log(`\n🧑‍💼 Cliente: ${nome} (ID: ${dados.cliente_id})`);
      console.log(`💰 Total seguro mensal: R$ ${dados.total_seguro.toFixed(2)}`);
      console.log(`📋 Locações (${dados.locacoes.length}):`);
      
      dados.locacoes.forEach(loc => {
        console.log(`   - ID ${loc.id}: R$ ${parseFloat(loc.valor_seguro).toFixed(2)} (${loc.data_locacao} até ${loc.data_entrega || 'em aberto'})`);
      });
    });

    // Verificar especificamente Walter Gonzales e Matheus
    console.log('\n🔍 Verificação específica:');
    console.log('='.repeat(30));
    
    const walter = Object.keys(clientesComSeguro).find(nome => 
      nome.toLowerCase().includes('walter') || nome.toLowerCase().includes('gonzales')
    );
    
    const matheus = Object.keys(clientesComSeguro).find(nome => 
      nome.toLowerCase().includes('matheus')
    );

    if (walter) {
      console.log(`✅ Walter encontrado: ${walter}`);
      console.log(`   Total seguro: R$ ${clientesComSeguro[walter].total_seguro.toFixed(2)}`);
    } else {
      console.log('❌ Walter não encontrado nas locações ativas com seguro');
    }

    if (matheus) {
      console.log(`✅ Matheus encontrado: ${matheus}`);
      console.log(`   Total seguro: R$ ${clientesComSeguro[matheus].total_seguro.toFixed(2)}`);
    } else {
      console.log('❌ Matheus não encontrado nas locações ativas com seguro');
    }

    // Buscar todos os clientes chamados Matheus
    console.log('\n🔍 Buscando todos os clientes Matheus...');
    const { data: clientesMatheus, error: errorMatheus } = await supabase
      .from('clientes')
      .select('id, nome')
      .ilike('nome', '%matheus%');

    if (clientesMatheus && clientesMatheus.length > 0) {
      console.log('👥 Clientes Matheus encontrados:');
      clientesMatheus.forEach(cliente => {
        console.log(`   - ID ${cliente.id}: ${cliente.nome}`);
      });

      // Verificar locações de cada Matheus
        for (const cliente of clientesMatheus) {
          const { data: locacoesMatheus } = await supabase
            .from('locacoes')
            .select('id, status, valor_seguro, data_locacao, data_entrega')
            .eq('cliente_id', cliente.id);

          console.log(`\n📋 Locações do ${cliente.nome} (ID: ${cliente.id}):`);
          if (locacoesMatheus && locacoesMatheus.length > 0) {
            locacoesMatheus.forEach(loc => {
              const seguro = parseFloat(loc.valor_seguro || 0);
              console.log(`   - ID ${loc.id}: Status ${loc.status}, Seguro R$ ${seguro.toFixed(2)} (${loc.data_locacao} até ${loc.data_entrega || 'em aberto'})`);
            });
          } else {
            console.log('   Nenhuma locação encontrada');
          }
        }
    } else {
      console.log('❌ Nenhum cliente Matheus encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugReceitaSeguros();