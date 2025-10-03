import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugMesAtual() {
  console.log('🔍 Debug do mês atual...\n');

  // Verificar data atual
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth(); // 0-11
  const mesAtualNumero = hoje.getMonth() + 1; // 1-12

  console.log('📅 Data atual:');
  console.log(`   Data completa: ${hoje.toISOString()}`);
  console.log(`   Ano atual: ${anoAtual}`);
  console.log(`   Mês atual (getMonth): ${mesAtual} (0-11)`);
  console.log(`   Mês atual (número): ${mesAtualNumero} (1-12)`);

  // Buscar movimentações de seguro
  const { data: movimentacoes, error } = await supabase
    .from('movimentacoes_financeiras')
    .select('*')
    .eq('categoria', 'seguro')
    .eq('tipo', 'entrada');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('\n📋 Movimentações de seguro:');
  movimentacoes.forEach(mov => {
    const dataMov = new Date(mov.data_movimentacao);
    const anoMov = dataMov.getFullYear();
    const mesMov = dataMov.getMonth(); // 0-11
    const mesMovNumero = dataMov.getMonth() + 1; // 1-12

    const isAnoCorreto = anoMov === anoAtual;
    const isMesCorreto = mesMov === mesAtual;
    const incluido = isAnoCorreto && isMesCorreto;

    console.log(`   ID: ${mov.id}`);
    console.log(`   Valor: R$ ${mov.valor}`);
    console.log(`   Data: ${mov.data_movimentacao}`);
    console.log(`   Ano da mov: ${anoMov} (igual ao atual? ${isAnoCorreto})`);
    console.log(`   Mês da mov (getMonth): ${mesMov} (igual ao atual? ${isMesCorreto})`);
    console.log(`   Mês da mov (número): ${mesMovNumero}`);
    console.log(`   Incluído no cálculo? ${incluido ? 'SIM' : 'NÃO'}`);
    console.log('   ---');
  });

  // Calcular receita usando a mesma lógica do dashboard
  const receitaSeguro = movimentacoes
    .filter(mov => {
      const dataMov = new Date(mov.data_movimentacao);
      return (
        mov.tipo === 'entrada' &&
        mov.categoria === 'seguro' &&
        dataMov.getFullYear() === anoAtual &&
        dataMov.getMonth() === mesAtual
      );
    })
    .reduce((acc, mov) => acc + mov.valor, 0);

  console.log(`\n💰 Receita de seguro calculada: R$ ${receitaSeguro}`);
}

debugMesAtual();