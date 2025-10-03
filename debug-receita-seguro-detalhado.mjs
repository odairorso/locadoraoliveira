import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugReceitaSeguro() {
  console.log('🔍 Debug detalhado da receita de seguro...\n');

  try {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    console.log(`📅 Mês/Ano atual: ${mesAtual}/${anoAtual}\n`);

    // 1. Buscar TODAS as movimentações de seguro
    console.log('📋 Buscando TODAS as movimentações de seguro...');
    const { data: todasMovimentacoes, error: errorTodas } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('categoria', 'seguro')
      .order('data_movimentacao', { ascending: false });

    if (errorTodas) {
      console.error('❌ Erro ao buscar todas as movimentações:', errorTodas);
      return;
    }

    console.log(`Total de movimentações de seguro: ${todasMovimentacoes?.length || 0}\n`);
    
    if (todasMovimentacoes && todasMovimentacoes.length > 0) {
      todasMovimentacoes.forEach((mov, index) => {
        const dataMovimentacao = new Date(mov.data_movimentacao + 'T00:00:00');
        const mesMovimentacao = dataMovimentacao.getMonth() + 1;
        const anoMovimentacao = dataMovimentacao.getFullYear();
        
        console.log(`${index + 1}. ID: ${mov.id}`);
        console.log(`   Valor: R$ ${mov.valor}`);
        console.log(`   Data: ${mov.data_movimentacao}`);
        console.log(`   Mês/Ano: ${mesMovimentacao}/${anoMovimentacao}`);
        console.log(`   Tipo: ${mov.tipo}`);
        console.log(`   Locação: #${mov.locacao_id || 'N/A'}`);
        console.log(`   Descrição: ${mov.descricao}`);
        console.log(`   É do mês atual? ${mesMovimentacao === mesAtual && anoMovimentacao === anoAtual ? 'SIM' : 'NÃO'}`);
        console.log('   ---');
      });
    }

    // 2. Aplicar o mesmo filtro que o dashboard usa
    console.log('\n💰 Aplicando filtro do dashboard (tipo=entrada, categoria=seguro, mês atual)...');
    
    const { data: movimentacoesFiltradas, error: errorFiltradas } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('tipo', 'entrada')
      .eq('categoria', 'seguro');

    if (errorFiltradas) {
      console.error('❌ Erro ao buscar movimentações filtradas:', errorFiltradas);
      return;
    }

    console.log(`Movimentações após filtro inicial: ${movimentacoesFiltradas?.length || 0}\n`);

    // 3. Filtrar por mês/ano manualmente
    const movimentacoesMesAtual = movimentacoesFiltradas?.filter(mov => {
      const dataMovimentacao = new Date(mov.data_movimentacao + 'T00:00:00');
      const mesMovimentacao = dataMovimentacao.getMonth() + 1;
      const anoMovimentacao = dataMovimentacao.getFullYear();
      return mesMovimentacao === mesAtual && anoMovimentacao === anoAtual;
    }) || [];

    console.log(`Movimentações do mês atual: ${movimentacoesMesAtual.length}\n`);

    if (movimentacoesMesAtual.length > 0) {
      movimentacoesMesAtual.forEach((mov, index) => {
        console.log(`${index + 1}. ID: ${mov.id} - R$ ${mov.valor} - ${mov.data_movimentacao}`);
      });
    }

    // 4. Calcular total
    const totalReceita = movimentacoesMesAtual.reduce((sum, mov) => sum + mov.valor, 0);
    console.log(`\n💰 TOTAL CALCULADO: R$ ${totalReceita}`);

    // 5. Verificar se outubro tem movimentações
    console.log('\n📅 Verificando movimentações de outubro especificamente...');
    const movimentacoesOutubro = todasMovimentacoes?.filter(mov => {
      const dataMovimentacao = new Date(mov.data_movimentacao + 'T00:00:00');
      const mesMovimentacao = dataMovimentacao.getMonth() + 1;
      const anoMovimentacao = dataMovimentacao.getFullYear();
      return mesMovimentacao === 10 && anoMovimentacao === 2025;
    }) || [];

    console.log(`Movimentações de outubro/2025: ${movimentacoesOutubro.length}`);
    movimentacoesOutubro.forEach(mov => {
      console.log(`   ID: ${mov.id} - R$ ${mov.valor} - ${mov.data_movimentacao}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugReceitaSeguro();