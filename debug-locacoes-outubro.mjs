import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLocacoesOutubro() {
  console.log('🔍 INVESTIGANDO LOCAÇÕES DE OUTUBRO 2025...\n');

  try {
    // 1. Buscar todas as locações de outubro
    console.log('📋 1. Buscando locações de outubro...');
    const { data: locacoesOutubro, error: locError } = await supabase
      .from('locacoes')
      .select(`
        id,
        data_locacao,
        data_entrega,
        valor_total,
        status,
        created_at,
        clientes (nome),
        veiculos (marca, modelo, placa)
      `)
      .gte('data_locacao', '2025-10-01')
      .lte('data_locacao', '2025-10-31')
      .order('data_locacao', { ascending: false });

    if (locError) {
      console.error('❌ Erro ao buscar locações:', locError);
      return;
    }

    console.log(`✅ Encontradas ${locacoesOutubro.length} locações em outubro 2025\n`);

    if (locacoesOutubro.length === 0) {
      console.log('⚠️  Nenhuma locação encontrada em outubro!');
      return;
    }

    // 2. Para cada locação, verificar se existe movimentação financeira
    console.log('💰 2. Verificando movimentações financeiras para cada locação:\n');
    
    for (const locacao of locacoesOutubro) {
      console.log(`🚗 Locação #${locacao.id}:`);
      console.log(`   Cliente: ${locacao.clientes?.nome}`);
      console.log(`   Veículo: ${locacao.veiculos?.marca} ${locacao.veiculos?.modelo} (${locacao.veiculos?.placa})`);
      console.log(`   Data locação: ${new Date(locacao.data_locacao).toLocaleDateString('pt-BR')}`);
      console.log(`   Data entrega: ${locacao.data_entrega ? new Date(locacao.data_entrega).toLocaleDateString('pt-BR') : 'Em andamento'}`);
      console.log(`   Valor total: R$ ${locacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   Status: ${locacao.status}`);
      console.log(`   Criada em: ${new Date(locacao.created_at).toLocaleString('pt-BR')}`);

      // Buscar movimentação financeira correspondente
      const { data: movimentacao, error: movError } = await supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .eq('locacao_id', locacao.id);

      if (movError) {
        console.log(`   ❌ Erro ao buscar movimentação: ${movError.message}`);
      } else if (movimentacao.length === 0) {
        console.log(`   ❌ PROBLEMA: Nenhuma movimentação financeira encontrada!`);
      } else {
        console.log(`   ✅ Movimentação encontrada:`);
        movimentacao.forEach(mov => {
          console.log(`      - Tipo: ${mov.tipo}`);
          console.log(`      - Valor: R$ ${mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`      - Data: ${new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}`);
          console.log(`      - Descrição: ${mov.descricao}`);
        });
      }
      console.log('');
    }

    // 3. Verificar todas as movimentações de outubro
    console.log('📊 3. Verificando todas as movimentações financeiras de outubro:\n');
    
    const { data: movimentacoesOutubro, error: movOutError } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .gte('data_movimentacao', '2025-10-01')
      .lte('data_movimentacao', '2025-10-31')
      .order('data_movimentacao', { ascending: false });

    if (movOutError) {
      console.error('❌ Erro ao buscar movimentações de outubro:', movOutError);
    } else {
      console.log(`📈 Total de movimentações em outubro: ${movimentacoesOutubro.length}`);
      
      if (movimentacoesOutubro.length === 0) {
        console.log('❌ PROBLEMA CONFIRMADO: Não há movimentações financeiras em outubro!');
      } else {
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        movimentacoesOutubro.forEach(mov => {
          console.log(`   ${mov.tipo.toUpperCase()}: R$ ${mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${mov.descricao} (${new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')})`);
          
          if (mov.tipo === 'entrada') {
            totalEntradas += mov.valor;
          } else {
            totalSaidas += mov.valor;
          }
        });
        
        console.log(`\n   💰 Total entradas: R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   💸 Total saídas: R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   📊 Saldo líquido: R$ ${(totalEntradas - totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      }
    }

    // 4. Diagnóstico final
    console.log('\n🔍 4. DIAGNÓSTICO:\n');
    
    const locacoesSemMovimentacao = locacoesOutubro.filter(async (locacao) => {
      const { data } = await supabase
        .from('movimentacoes_financeiras')
        .select('id')
        .eq('locacao_id', locacao.id);
      return !data || data.length === 0;
    });

    if (locacoesOutubro.length > 0 && (!movimentacoesOutubro || movimentacoesOutubro.length === 0)) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - Existem locações em outubro');
      console.log('   - Mas não há movimentações financeiras correspondentes');
      console.log('   - O código automático de criação de movimentações não está funcionando');
      console.log('\n💡 SOLUÇÃO NECESSÁRIA:');
      console.log('   - Verificar logs de erro na criação de locações');
      console.log('   - Executar script para criar movimentações faltantes');
      console.log('   - Corrigir o código automático se necessário');
    } else {
      console.log('✅ Sistema funcionando corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  }
}

debugLocacoesOutubro();