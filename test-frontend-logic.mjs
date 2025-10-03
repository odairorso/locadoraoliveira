import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendLogic() {
  console.log('🧪 Testando lógica do frontend...\n');
  
  // Simular os parâmetros do relatório
  const dataInicio = '2025-08-01';
  const dataFim = '2025-10-31';
  
  console.log(`📅 Período do relatório: ${dataInicio} até ${dataFim}\n`);
  
  try {
    // Buscar locações exatamente como no frontend corrigido
    const { data: locacoes, error: errorLoc } = await supabase
      .from('locacoes')
      .select('id, data_locacao, data_entrega, status')
      .lte('data_locacao', dataFim)
      .order('data_locacao', { ascending: true });

    if (errorLoc) {
      console.error('❌ Erro ao buscar locações:', errorLoc);
      return;
    }

    console.log(`📊 Total de locações encontradas: ${locacoes?.length || 0}\n`);

    // Simular a lógica do frontend
    const dadosAgrupados = {};

    // Calcular locações ativas por mês
    (locacoes || []).forEach((locacao) => {
      const dataInicioLocacao = new Date(locacao.data_locacao);
      const dataFimLocacao = locacao.data_entrega ? new Date(locacao.data_entrega) : new Date();
      
      console.log(`🔍 Processando locação ${locacao.id}:`);
      console.log(`   Início: ${locacao.data_locacao}`);
      console.log(`   Fim: ${locacao.data_entrega || 'Em andamento'}`);
      console.log(`   Status: ${locacao.status}`);
      
      // Para cada mês no período do relatório, verificar se a locação estava ativa
      const dataInicioRelatorio = new Date(dataInicio);
      const dataFimRelatorio = new Date(dataFim);
      
      let mesAtual = new Date(dataInicioRelatorio.getFullYear(), dataInicioRelatorio.getMonth(), 1);
      const ultimoMesRelatorio = new Date(dataFimRelatorio.getFullYear(), dataFimRelatorio.getMonth(), 1);
      
      while (mesAtual <= ultimoMesRelatorio) {
        const chave = mesAtual.toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: '2-digit' 
        });
        
        const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
        
        // Verificar se a locação estava ativa durante este mês
        const locacaoAtivaNoMes = (
          dataInicioLocacao <= ultimoDiaMes && // Locação começou antes ou durante o mês
          dataFimLocacao >= primeiroDiaMes     // Locação terminou depois ou durante o mês
        );
        
        console.log(`   Mês ${chave}: ${locacaoAtivaNoMes ? '✅ ATIVA' : '❌ Inativa'}`);
        
        if (locacaoAtivaNoMes) {
          if (!dadosAgrupados[chave]) {
            dadosAgrupados[chave] = { mes: chave, receitas: 0, despesas: 0, lucro: 0, locacoes_ativas: 0 };
          }
          dadosAgrupados[chave].locacoes_ativas++;
        }
        
        // Próximo mês
        mesAtual.setMonth(mesAtual.getMonth() + 1);
      }
      
      console.log(''); // Linha em branco
    });

    console.log('📈 RESULTADO FINAL:');
    Object.keys(dadosAgrupados).sort().forEach(chave => {
      const dados = dadosAgrupados[chave];
      console.log(`   ${dados.mes}: ${dados.locacoes_ativas} locações ativas`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFrontendLogic().catch(console.error);