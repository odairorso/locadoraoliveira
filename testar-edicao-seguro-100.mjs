import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarEdicaoSeguro100() {
  console.log('🔧 Testando edição do valor do seguro para R$ 100...\n');

  try {
    // 1. Buscar uma locação ativa para testar
    console.log('📋 Buscando locação ativa para teste...');
    const { data: locacoes, error: errorLocacoes } = await supabase
      .from('locacoes')
      .select('id, valor_seguro, cliente_id, data_locacao')
      .eq('status', 'ativa')
      .limit(1);

    if (errorLocacoes) {
      console.error('❌ Erro ao buscar locações:', errorLocacoes);
      return;
    }

    if (!locacoes || locacoes.length === 0) {
      console.log('❌ Nenhuma locação ativa encontrada para teste');
      return;
    }

    const locacao = locacoes[0];
    console.log(`✅ Locação encontrada: #${locacao.id}`);
    console.log(`   Valor seguro atual: R$ ${locacao.valor_seguro || 0}\n`);

    // 2. Simular uma atualização do valor do seguro para R$ 100
    const novoValorSeguro = 100.00;
    console.log(`🔄 Simulando atualização do valor do seguro para R$ ${novoValorSeguro}...`);

    // Simular o que o frontend faria
    const updateData = {
      valor_seguro: novoValorSeguro
    };

    console.log('📤 Dados que seriam enviados pelo frontend:', JSON.stringify(updateData, null, 2));

    // 3. Fazer a atualização usando a mesma lógica da API
    const { data: updatedLocacao, error: updateError } = await supabase
      .from('locacoes')
      .update(updateData)
      .eq('id', locacao.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar locação:', updateError);
      return;
    }

    console.log('✅ Locação atualizada com sucesso!');
    console.log(`   Novo valor do seguro: R$ ${updatedLocacao.valor_seguro}\n`);

    // 4. Verificar se a movimentação financeira foi criada/atualizada
    console.log('💰 Verificando movimentações financeiras do seguro...');
    
    const { data: movimentacoes, error: errorMovimentacoes } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('locacao_id', locacao.id)
      .eq('categoria', 'seguro')
      .order('created_at', { ascending: false });

    if (errorMovimentacoes) {
      console.error('❌ Erro ao buscar movimentações:', errorMovimentacoes);
      return;
    }

    if (movimentacoes && movimentacoes.length > 0) {
      console.log('✅ Movimentações de seguro encontradas:');
      movimentacoes.forEach((mov, index) => {
        console.log(`   ${index + 1}. ID: ${mov.id}, Valor: R$ ${mov.valor}, Data: ${mov.data_movimentacao}`);
      });
    } else {
      console.log('❌ Nenhuma movimentação de seguro encontrada');
    }

    // 5. Verificar o dashboard após a atualização
    console.log('\n📊 Verificando dashboard após atualização...');
    
    const response = await fetch('http://localhost:5174/api/dashboard');
    if (response.ok) {
      const dashboardData = await response.json();
      console.log(`   Receita de Seguro no Dashboard: R$ ${dashboardData.receitaSeguro || 0}`);
      console.log(`   Locações Ativas: ${dashboardData.locacoesAtivas || 0}`);
    } else {
      console.log('❌ Erro ao acessar dashboard');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarEdicaoSeguro100();