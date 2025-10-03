import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verificarLocacoesReais() {
  console.log('🔍 Verificando locações ativas REAIS...\n');

  try {
    // 1. Buscar TODAS as locações ativas
    console.log('📋 Buscando todas as locações ativas...');
    const { data: locacoes, error: errorLocacoes } = await supabase
      .from('locacoes')
      .select(`
        id,
        data_locacao,
        data_entrega,
        valor_total,
        valor_seguro,
        status,
        observacoes,
        clientes (
          nome
        ),
        veiculos (
          marca,
          modelo,
          placa
        )
      `)
      .eq('status', 'ativa')
      .order('id');

    if (errorLocacoes) {
      console.error('❌ Erro ao buscar locações:', errorLocacoes);
      return;
    }

    console.log(`Total de locações ativas: ${locacoes.length}\n`);

    locacoes.forEach((locacao, index) => {
      console.log(`${index + 1}. LOCAÇÃO #${locacao.id}`);
      console.log(`   Cliente: ${locacao.clientes?.nome || 'N/A'}`);
      console.log(`   Veículo: ${locacao.veiculos?.marca} ${locacao.veiculos?.modelo} - ${locacao.veiculos?.placa}`);
      console.log(`   Período: ${locacao.data_locacao} até ${locacao.data_entrega}`);
      console.log(`   Valor Total: R$ ${locacao.valor_total}`);
      console.log(`   Valor Seguro: R$ ${locacao.valor_seguro || 0}`);
      console.log(`   Status: ${locacao.status}`);
      console.log(`   Observações: ${locacao.observacoes || 'Nenhuma'}`);
      console.log('   ---\n');
    });

    // 2. Verificar movimentações financeiras de seguro
    console.log('💰 Verificando movimentações financeiras de seguro...');
    const { data: movimentacoes, error: errorMov } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('categoria', 'seguro')
      .order('data_movimentacao', { ascending: false });

    if (errorMov) {
      console.error('❌ Erro ao buscar movimentações:', errorMov);
      return;
    }

    console.log(`Total de movimentações de seguro: ${movimentacoes.length}\n`);

    if (movimentacoes.length === 0) {
      console.log('✅ Nenhuma movimentação de seguro encontrada (correto!)');
    } else {
      console.log('⚠️  Movimentações de seguro encontradas:');
      movimentacoes.forEach((mov, index) => {
        console.log(`   ${index + 1}. ID: ${mov.id}`);
        console.log(`      Valor: R$ ${mov.valor}`);
        console.log(`      Data: ${mov.data_movimentacao}`);
        console.log(`      Tipo: ${mov.tipo}`);
        console.log(`      Locação: #${mov.locacao_id || 'N/A'}`);
        console.log(`      Descrição: ${mov.descricao || 'N/A'}`);
        console.log('      ---');
      });
    }

    // 3. Verificar se há inconsistências
    console.log('\n🔍 ANÁLISE DE INCONSISTÊNCIAS:');
    
    const totalSeguroLocacoes = locacoes.reduce((sum, loc) => sum + (loc.valor_seguro || 0), 0);
    const totalMovimentacoes = movimentacoes.reduce((sum, mov) => sum + mov.valor, 0);
    
    console.log(`   Total valor_seguro nas locações: R$ ${totalSeguroLocacoes}`);
    console.log(`   Total movimentações de seguro: R$ ${totalMovimentacoes}`);
    
    if (totalSeguroLocacoes === 0 && totalMovimentacoes === 0) {
      console.log('✅ CORRETO: Nenhum seguro lançado em lugar nenhum');
    } else if (totalSeguroLocacoes === 0 && totalMovimentacoes > 0) {
      console.log('❌ PROBLEMA: Há movimentações de seguro mas nenhuma locação tem valor_seguro');
    } else if (totalSeguroLocacoes > 0 && totalMovimentacoes === 0) {
      console.log('❌ PROBLEMA: Há valor_seguro nas locações mas nenhuma movimentação financeira');
    } else if (totalSeguroLocacoes !== totalMovimentacoes) {
      console.log('❌ PROBLEMA: Valores não batem entre locações e movimentações');
    } else {
      console.log('✅ CORRETO: Valores batem entre locações e movimentações');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarLocacoesReais();