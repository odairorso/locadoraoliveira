import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarEdicaoSeguro() {
  console.log('🔧 Testando edição do valor do seguro...\n');

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

    // 2. Simular uma atualização do valor do seguro
    const novoValorSeguro = 75.00;
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
    console.log(`   Novo valor seguro: R$ ${updatedLocacao.valor_seguro}\n`);

    // 4. Verificar se a movimentação financeira foi criada/atualizada
    console.log('💰 Verificando movimentação financeira do seguro...');
    
    if (novoValorSeguro > 0) {
      // Verificar se já existe uma movimentação de seguro para esta locação
      const { data: existingSeguro, error: checkError } = await supabase
        .from('movimentacoes_financeiras')
        .select('id, valor, descricao')
        .eq('locacao_id', locacao.id)
        .eq('tipo', 'entrada')
        .eq('categoria', 'seguro')
        .single();

      if (existingSeguro) {
        console.log('✅ Movimentação de seguro existente encontrada:');
        console.log(`   ID: ${existingSeguro.id}`);
        console.log(`   Valor: R$ ${existingSeguro.valor}`);
        console.log(`   Descrição: ${existingSeguro.descricao}`);
        
        // Atualizar movimentação existente
        const { error: seguroUpdateError } = await supabase
          .from('movimentacoes_financeiras')
          .update({ 
            valor: novoValorSeguro,
            descricao: `Recebimento de Seguro - Locação #${locacao.id} (Valor Atualizado)`
          })
          .eq('id', existingSeguro.id);

        if (seguroUpdateError) {
          console.error('❌ Erro ao atualizar movimentação financeira do seguro:', seguroUpdateError);
        } else {
          console.log('✅ Movimentação financeira do seguro atualizada!');
        }
      } else {
        console.log('ℹ️ Nenhuma movimentação de seguro existente, criando nova...');
        
        // Criar nova movimentação de seguro
        const { error: seguroCreateError } = await supabase
          .from('movimentacoes_financeiras')
          .insert({
            tipo: 'entrada',
            categoria: 'seguro',
            descricao: `Recebimento de Seguro - Locação #${locacao.id}`,
            valor: novoValorSeguro,
            data_movimentacao: locacao.data_locacao,
            locacao_id: locacao.id,
            cliente_id: locacao.cliente_id,
          });

        if (seguroCreateError) {
          console.error('❌ Erro ao criar movimentação financeira do seguro:', seguroCreateError);
        } else {
          console.log('✅ Nova movimentação financeira do seguro criada!');
        }
      }
    }

    // 5. Verificar o resultado final
    console.log('\n📊 Verificação final...');
    
    const { data: finalLocacao, error: finalError } = await supabase
      .from('locacoes')
      .select('id, valor_seguro')
      .eq('id', locacao.id)
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
      return;
    }

    console.log(`✅ Valor final do seguro na locação: R$ ${finalLocacao.valor_seguro}`);

    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes_financeiras')
      .select('id, valor, descricao')
      .eq('locacao_id', locacao.id)
      .eq('categoria', 'seguro');

    if (movError) {
      console.error('❌ Erro ao verificar movimentações:', movError);
      return;
    }

    console.log(`✅ Total de movimentações de seguro: ${movimentacoes.length}`);
    movimentacoes.forEach(mov => {
      console.log(`   - ID ${mov.id}: R$ ${mov.valor} - ${mov.descricao}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarEdicaoSeguro();