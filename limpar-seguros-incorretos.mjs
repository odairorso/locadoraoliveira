import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function limparSegurosIncorretos() {
  console.log('🧹 Limpando valores de seguro incorretos...\n');

  try {
    // 1. Zerar valor_seguro das locações #27 e #31
    console.log('📋 Zerando valor_seguro das locações #27 e #31...');
    
    const { error: errorLocacao27 } = await supabase
      .from('locacoes')
      .update({ valor_seguro: 0 })
      .eq('id', 27);

    if (errorLocacao27) {
      console.error('❌ Erro ao atualizar locação #27:', errorLocacao27);
      return;
    }

    const { error: errorLocacao31 } = await supabase
      .from('locacoes')
      .update({ valor_seguro: 0 })
      .eq('id', 31);

    if (errorLocacao31) {
      console.error('❌ Erro ao atualizar locação #31:', errorLocacao31);
      return;
    }

    console.log('✅ Valores de seguro zerados nas locações');

    // 2. Remover movimentações financeiras de seguro
    console.log('\n💰 Removendo movimentações financeiras de seguro...');
    
    const { error: errorMovimentacoes } = await supabase
      .from('movimentacoes_financeiras')
      .delete()
      .eq('categoria', 'seguro');

    if (errorMovimentacoes) {
      console.error('❌ Erro ao remover movimentações:', errorMovimentacoes);
      return;
    }

    console.log('✅ Movimentações de seguro removidas');

    // 3. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    
    // Verificar locações
    const { data: locacoes, error: errorVerificarLoc } = await supabase
      .from('locacoes')
      .select('id, valor_seguro')
      .in('id', [27, 31]);

    if (errorVerificarLoc) {
      console.error('❌ Erro ao verificar locações:', errorVerificarLoc);
      return;
    }

    console.log('📋 Locações após limpeza:');
    locacoes.forEach(loc => {
      console.log(`   Locação #${loc.id}: valor_seguro = R$ ${loc.valor_seguro}`);
    });

    // Verificar movimentações
    const { data: movimentacoes, error: errorVerificarMov } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('categoria', 'seguro');

    if (errorVerificarMov) {
      console.error('❌ Erro ao verificar movimentações:', errorVerificarMov);
      return;
    }

    console.log(`\n💰 Movimentações de seguro restantes: ${movimentacoes.length}`);
    
    if (movimentacoes.length === 0) {
      console.log('✅ Perfeito! Nenhuma movimentação de seguro restante');
    } else {
      console.log('⚠️  Ainda há movimentações:');
      movimentacoes.forEach(mov => {
        console.log(`   ID: ${mov.id} - R$ ${mov.valor} - ${mov.data_movimentacao}`);
      });
    }

    console.log('\n🎯 RESULTADO FINAL:');
    console.log('✅ Valores de seguro zerados nas locações ativas');
    console.log('✅ Movimentações financeiras de seguro removidas');
    console.log('✅ Dashboard agora deve mostrar R$ 0 para receita de seguro');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

limparSegurosIncorretos();