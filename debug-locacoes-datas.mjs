import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateFinanceiroLogic() {
  console.log('=== SIMULANDO LÓGICA DA API FINANCEIRO ===');
  
  const inicio = '2025-08-01';
  const fim = '2025-10-31';
  
  try {
    // Buscar locações exatamente como na API
    const { data: locacoes, error } = await supabase
      .from('locacoes')
      .select('id, data_locacao, data_entrega, status')
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim)
      .order('data_locacao', { ascending: true });
      
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log(`\nTotal de locações encontradas: ${locacoes?.length || 0}`);
    
    // Simular a lógica exata da API
    const dadosPorMes = {};
    
    function inicializarMes(chave, data) {
      if (!dadosPorMes[chave]) {
        const meses = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        
        dadosPorMes[chave] = {
          mes: `${meses[data.getMonth()]} de ${data.getFullYear()}`,
          receitas: 0,
          despesas: 0,
          locacoes_ativas: 0
        };
      }
    }
    
    console.log('\n=== PROCESSANDO LOCAÇÕES ===');
    
    locacoes.forEach((locacao, index) => {
      console.log(`\n${index + 1}. Processando locação ID ${locacao.id}:`);
      console.log(`   Data locação: ${locacao.data_locacao}`);
      console.log(`   Data entrega: ${locacao.data_entrega || 'Não definida'}`);
      console.log(`   Status: ${locacao.status}`);
      
      const dataInicio = new Date(locacao.data_locacao);
      const dataFim = locacao.data_entrega ? new Date(locacao.data_entrega) : new Date();
      
      console.log(`   Data início processada: ${dataInicio.toISOString()}`);
      console.log(`   Data fim processada: ${dataFim.toISOString()}`);
      
      // Para cada mês no período, verificar se a locação estava ativa
      const inicioMes = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      const fimMes = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
      
      console.log(`   Período de meses a verificar: ${inicioMes.toISOString()} até ${fimMes.toISOString()}`);
      
      let mesAtual = new Date(inicioMes);
      
      while (mesAtual <= fimMes) {
        const chave = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
        
        // Verificar se este mês está no período solicitado
        const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
        
        console.log(`     Verificando mês ${chave}:`);
        console.log(`       Primeiro dia: ${primeiroDiaMes.toISOString()}`);
        console.log(`       Último dia: ${ultimoDiaMes.toISOString()}`);
        console.log(`       Período solicitado: ${inicio} a ${fim}`);
        
        const dentroDoPeríodo = primeiroDiaMes >= new Date(inicio) && ultimoDiaMes <= new Date(fim);
        console.log(`       Dentro do período: ${dentroDoPeríodo}`);
        
        if (dentroDoPeríodo) {
          inicializarMes(chave, mesAtual);
          
          // Verificar se a locação estava ativa durante este mês
          const locacaoAtivaNoMes = (
            dataInicio <= ultimoDiaMes && // Locação começou antes ou durante o mês
            dataFim >= primeiroDiaMes     // Locação terminou depois ou durante o mês
          );
          
          console.log(`       Locação ativa no mês: ${locacaoAtivaNoMes}`);
          console.log(`         dataInicio <= ultimoDiaMes: ${dataInicio.toISOString()} <= ${ultimoDiaMes.toISOString()} = ${dataInicio <= ultimoDiaMes}`);
          console.log(`         dataFim >= primeiroDiaMes: ${dataFim.toISOString()} >= ${primeiroDiaMes.toISOString()} = ${dataFim >= primeiroDiaMes}`);
          
          if (locacaoAtivaNoMes) {
            dadosPorMes[chave].locacoes_ativas++;
            console.log(`       ✓ Incrementando contador para ${chave}. Total: ${dadosPorMes[chave].locacoes_ativas}`);
          }
        }
        
        // Próximo mês
        mesAtual.setMonth(mesAtual.getMonth() + 1);
      }
    });
    
    console.log('\n=== RESULTADO FINAL ===');
    Object.keys(dadosPorMes).sort().forEach(chave => {
      const dados = dadosPorMes[chave];
      console.log(`${dados.mes}: ${dados.locacoes_ativas} locações ativas`);
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

simulateFinanceiroLogic();