import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function corrigirDataMovimentacao() {
  console.log('🔧 Corrigindo data da movimentação da locação #27...\n');

  try {
    // 1. Verificar a movimentação atual
    console.log('📋 Verificando movimentação atual da locação #27...');
    const { data: movimentacao, error: errorBuscar } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('locacao_id', 27)
      .eq('categoria', 'seguro')
      .single();

    if (errorBuscar) {
      console.error('❌ Erro ao buscar movimentação:', errorBuscar);
      return;
    }

    console.log('Movimentação encontrada:');
    console.log(`   ID: ${movimentacao.id}`);
    console.log(`   Valor: R$ ${movimentacao.valor}`);
    console.log(`   Data atual: ${movimentacao.data_movimentacao}`);
    console.log(`   Locação: #${movimentacao.locacao_id}`);

    // 2. Atualizar a data para outubro (data da locação)
    console.log('\n🔄 Atualizando data para outubro...');
    const { error: errorAtualizar } = await supabase
      .from('movimentacoes_financeiras')
      .update({
        data_movimentacao: '2025-10-01' // Primeiro dia de outubro
      })
      .eq('id', movimentacao.id);

    if (errorAtualizar) {
      console.error('❌ Erro ao atualizar movimentação:', errorAtualizar);
      return;
    }

    console.log('✅ Data atualizada com sucesso!');

    // 3. Verificar resultado
    console.log('\n📋 Verificando resultado...');
    const { data: movimentacaoAtualizada, error: errorVerificar } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('id', movimentacao.id)
      .single();

    if (errorVerificar) {
      console.error('❌ Erro ao verificar resultado:', errorVerificar);
      return;
    }

    console.log('Movimentação atualizada:');
    console.log(`   ID: ${movimentacaoAtualizada.id}`);
    console.log(`   Valor: R$ ${movimentacaoAtualizada.valor}`);
    console.log(`   Data nova: ${movimentacaoAtualizada.data_movimentacao}`);
    console.log(`   Locação: #${movimentacaoAtualizada.locacao_id}`);

    // 4. Calcular nova receita de seguro do mês
    console.log('\n💰 Calculando nova receita de seguro do mês...');
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();

    const { data: movimentacoesMes, error: errorMes } = await supabase
      .from('movimentacoes_financeiras')
      .select('valor')
      .eq('tipo', 'entrada')
      .eq('categoria', 'seguro');

    if (errorMes) {
      console.error('❌ Erro ao buscar movimentações do mês:', errorMes);
      return;
    }

    const movimentacoesMesAtual = movimentacoesMes?.filter(mov => {
      const dataMovimentacao = new Date(mov.data_movimentacao + 'T00:00:00');
      const mesMovimentacao = dataMovimentacao.getMonth() + 1;
      const anoMovimentacao = dataMovimentacao.getFullYear();
      return mesMovimentacao === mesAtual && anoMovimentacao === anoAtual;
    }) || [];

    const totalReceita = movimentacoesMesAtual.reduce((sum, mov) => sum + mov.valor, 0);
    console.log(`💰 Nova receita de seguro do mês: R$ ${totalReceita}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

corrigirDataMovimentacao();