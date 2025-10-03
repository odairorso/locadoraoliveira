import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function corrigirMovimentacoesSeguro() {
  console.log('🔧 Corrigindo movimentações de seguro...\n');

  try {
    // 1. Primeiro, vamos verificar a movimentação atual da locação #31
    console.log('📋 Verificando movimentação atual da locação #31...');
    const { data: movimentacaoAtual, error: errorMovimentacao } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('locacao_id', 31)
      .eq('categoria', 'seguro');

    if (errorMovimentacao) {
      console.error('❌ Erro ao buscar movimentação:', errorMovimentacao);
      return;
    }

    console.log('Movimentação encontrada:', movimentacaoAtual);

    // 2. Verificar o valor atual do seguro na locação
    console.log('\n📋 Verificando valor atual do seguro na locação #31...');
    const { data: locacao, error: errorLocacao } = await supabase
      .from('locacoes')
      .select('id, valor_seguro')
      .eq('id', 31)
      .single();

    if (errorLocacao) {
      console.error('❌ Erro ao buscar locação:', errorLocacao);
      return;
    }

    console.log('Valor atual do seguro na locação:', locacao.valor_seguro);

    // 3. Se existe movimentação antiga e o valor é diferente, corrigir
    if (movimentacaoAtual && movimentacaoAtual.length > 0) {
      const movimentacao = movimentacaoAtual[0];
      
      if (movimentacao.valor !== locacao.valor_seguro) {
        console.log(`\n⚠️  INCONSISTÊNCIA DETECTADA:`);
        console.log(`   Movimentação: R$ ${movimentacao.valor}`);
        console.log(`   Locação: R$ ${locacao.valor_seguro}`);
        
        // Remover movimentação antiga
        console.log('\n🗑️  Removendo movimentação antiga...');
        const { error: errorDelete } = await supabase
          .from('movimentacoes_financeiras')
          .delete()
          .eq('id', movimentacao.id);

        if (errorDelete) {
          console.error('❌ Erro ao remover movimentação antiga:', errorDelete);
          return;
        }
        console.log('✅ Movimentação antiga removida com sucesso!');

        // Criar nova movimentação com valor correto
        if (locacao.valor_seguro > 0) {
          console.log('\n💰 Criando nova movimentação com valor correto...');
          const { error: errorInsert } = await supabase
            .from('movimentacoes_financeiras')
            .insert({
              tipo: 'entrada',
              categoria: 'seguro',
              valor: locacao.valor_seguro,
              descricao: `Recebimento de Seguro - Locação #${locacao.id}`,
              data_movimentacao: new Date().toISOString().split('T')[0],
              locacao_id: locacao.id
            });

          if (errorInsert) {
            console.error('❌ Erro ao criar nova movimentação:', errorInsert);
            return;
          }
          console.log('✅ Nova movimentação criada com sucesso!');
        }
      } else {
        console.log('✅ Valores já estão consistentes!');
      }
    } else if (locacao.valor_seguro > 0) {
      // Se não existe movimentação mas há valor de seguro, criar
      console.log('\n💰 Criando movimentação para valor de seguro...');
      const { error: errorInsert } = await supabase
        .from('movimentacoes_financeiras')
        .insert({
          tipo: 'entrada',
          categoria: 'seguro',
          valor: locacao.valor_seguro,
          descricao: `Recebimento de Seguro - Locação #${locacao.id}`,
          data_movimentacao: new Date().toISOString().split('T')[0],
          locacao_id: locacao.id
        });

      if (errorInsert) {
        console.error('❌ Erro ao criar movimentação:', errorInsert);
        return;
      }
      console.log('✅ Movimentação criada com sucesso!');
    }

    // 4. Verificar resultado final
    console.log('\n📊 VERIFICAÇÃO FINAL:');
    const { data: movimentacaoFinal } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('locacao_id', 31)
      .eq('categoria', 'seguro');

    console.log('Movimentações finais da locação #31:', movimentacaoFinal);

    // 5. Calcular total de receita de seguro atual
    const { data: todasMovimentacoes } = await supabase
      .from('movimentacoes_financeiras')
      .select('valor')
      .eq('tipo', 'entrada')
      .eq('categoria', 'seguro');

    const totalReceita = todasMovimentacoes?.reduce((sum, mov) => sum + mov.valor, 0) || 0;
    console.log(`\n💰 Total de receita de seguro no sistema: R$ ${totalReceita}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

corrigirMovimentacoesSeguro();