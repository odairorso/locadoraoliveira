import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verificarLocacoesAtivas() {
  console.log('🔍 Verificando locações ativas e valores de seguro...\n');

  try {
    // 1. Buscar todas as locações ativas
    console.log('📋 Buscando locações ativas...');
    const { data: locacoes, error: errorLocacoes } = await supabase
      .from('locacoes')
      .select(`
        id,
        valor_seguro,
        status,
        observacoes,
        data_locacao,
        data_entrega,
        cliente:clientes(nome),
        veiculo:veiculos(placa, marca, modelo)
      `)
      .eq('status', 'ativa')
      .order('id', { ascending: true });

    if (errorLocacoes) {
      console.error('❌ Erro ao buscar locações:', errorLocacoes);
      return;
    }

    console.log(`\n📊 LOCAÇÕES ATIVAS ENCONTRADAS: ${locacoes?.length || 0}\n`);

    if (locacoes && locacoes.length > 0) {
      locacoes.forEach((locacao, index) => {
        console.log(`${index + 1}. Locação #${locacao.id}`);
        console.log(`   Cliente: ${locacao.cliente?.nome || 'N/A'}`);
        console.log(`   Veículo: ${locacao.veiculo?.placa || 'N/A'} (${locacao.veiculo?.marca} ${locacao.veiculo?.modelo})`);
        console.log(`   Valor Seguro: R$ ${locacao.valor_seguro || 0}`);
        console.log(`   Status: ${locacao.status}`);
        console.log(`   Período: ${locacao.data_locacao} até ${locacao.data_entrega}`);
        console.log(`   Observações: ${locacao.observacoes || 'Nenhuma'}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ Nenhuma locação ativa encontrada!');
    }

    // 2. Verificar movimentações de seguro existentes
    console.log('\n💰 Verificando movimentações de seguro...');
    const { data: movimentacoes, error: errorMovimentacoes } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('categoria', 'seguro')
      .order('data_movimentacao', { ascending: false });

    if (errorMovimentacoes) {
      console.error('❌ Erro ao buscar movimentações:', errorMovimentacoes);
      return;
    }

    console.log(`\n📊 MOVIMENTAÇÕES DE SEGURO: ${movimentacoes?.length || 0}\n`);

    if (movimentacoes && movimentacoes.length > 0) {
      movimentacoes.forEach((mov, index) => {
        console.log(`${index + 1}. ID: ${mov.id}`);
        console.log(`   Valor: R$ ${mov.valor}`);
        console.log(`   Data: ${mov.data_movimentacao}`);
        console.log(`   Locação: #${mov.locacao_id || 'N/A'}`);
        console.log(`   Descrição: ${mov.descricao}`);
        console.log('   ---');
      });
    } else {
      console.log('✅ Nenhuma movimentação de seguro encontrada (correto se não há seguros lançados)');
    }

    // 3. Calcular totais
    const totalSeguroLocacoes = locacoes?.reduce((sum, loc) => sum + (loc.valor_seguro || 0), 0) || 0;
    const totalMovimentacoes = movimentacoes?.reduce((sum, mov) => sum + mov.valor, 0) || 0;

    console.log('\n📊 RESUMO:');
    console.log(`   Total valor_seguro nas locações: R$ ${totalSeguroLocacoes}`);
    console.log(`   Total movimentações de seguro: R$ ${totalMovimentacoes}`);
    
    if (totalSeguroLocacoes === totalMovimentacoes) {
      console.log('✅ Valores consistentes!');
    } else {
      console.log('⚠️  INCONSISTÊNCIA DETECTADA!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarLocacoesAtivas();