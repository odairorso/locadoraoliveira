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

async function criarMovimentacaoManual() {
  console.log('🔧 CRIANDO MOVIMENTAÇÃO FINANCEIRA MANUAL...\n');

  try {
    // 1. Buscar a locação #31 que não tem movimentação
    console.log('📋 1. Buscando dados da locação #31...');
    const { data: locacao, error: locError } = await supabase
      .from('locacoes')
      .select('*')
      .eq('id', 31)
      .single();

    if (locError) {
      console.error('❌ Erro ao buscar locação:', locError);
      return;
    }

    if (!locacao) {
      console.log('❌ Locação #31 não encontrada');
      return;
    }

    console.log('✅ Locação encontrada:');
    console.log(`   ID: ${locacao.id}`);
    console.log(`   Cliente ID: ${locacao.cliente_id}`);
    console.log(`   Valor total: R$ ${locacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   Data locação: ${new Date(locacao.data_locacao).toLocaleDateString('pt-BR')}`);

    // 2. Verificar se já existe movimentação
    console.log('\n💰 2. Verificando se já existe movimentação...');
    const { data: movExistente, error: movExError } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('locacao_id', 31);

    if (movExError) {
      console.error('❌ Erro ao verificar movimentação existente:', movExError);
      return;
    }

    if (movExistente && movExistente.length > 0) {
      console.log('⚠️  Já existe movimentação para esta locação:');
      movExistente.forEach(mov => {
        console.log(`   - ID: ${mov.id}, Valor: R$ ${mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      });
      return;
    }

    console.log('✅ Nenhuma movimentação existente encontrada');

    // 3. Criar a movimentação financeira
    console.log('\n💸 3. Criando movimentação financeira...');
    
    const movimentacaoData = {
      tipo: 'entrada',
      categoria: 'locacao',
      descricao: `Recebimento da Locação #${locacao.id}`,
      valor: locacao.valor_total,
      data_movimentacao: locacao.data_locacao,
      locacao_id: locacao.id,
      cliente_id: locacao.cliente_id,
    };

    console.log('📝 Dados da movimentação a ser criada:');
    console.log(JSON.stringify(movimentacaoData, null, 2));

    const { data: novaMovimentacao, error: movError } = await supabase
      .from('movimentacoes_financeiras')
      .insert(movimentacaoData)
      .select()
      .single();

    if (movError) {
      console.error('❌ Erro ao criar movimentação financeira:', movError);
      console.error('Detalhes do erro:', JSON.stringify(movError, null, 2));
      return;
    }

    console.log('✅ Movimentação financeira criada com sucesso!');
    console.log(`   ID: ${novaMovimentacao.id}`);
    console.log(`   Valor: R$ ${novaMovimentacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   Data: ${new Date(novaMovimentacao.data_movimentacao).toLocaleDateString('pt-BR')}`);

    // 4. Verificar se agora aparece no dashboard
    console.log('\n📊 4. Verificando receita do mês atual...');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const { data: movimentacoesMes, error: movMesError } = await supabase
      .from('movimentacoes_financeiras')
      .select('valor')
      .eq('tipo', 'entrada')
      .gte('data_movimentacao', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lte('data_movimentacao', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);

    if (movMesError) {
      console.error('❌ Erro ao calcular receita do mês:', movMesError);
    } else {
      const receitaMes = movimentacoesMes.reduce((total, mov) => total + mov.valor, 0);
      console.log(`✅ Receita do mês atual: R$ ${receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

criarMovimentacaoManual();