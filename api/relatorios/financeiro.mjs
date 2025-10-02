import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('Variáveis de ambiente:');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'Não definida');

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({
      success: false,
      error: 'Variáveis de ambiente do Supabase não configuradas'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
    const { inicio, fim } = request.query;

    if (!inicio || !fim) {
      return response.status(400).json({
        success: false,
        error: "Parâmetros 'inicio' e 'fim' são obrigatórios"
      });
    }

    // Buscar movimentações financeiras no período
    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .gte('data_movimentacao', inicio)
      .lte('data_movimentacao', fim)
      .order('data_movimentacao');

    if (movError) {
      console.error('Erro ao buscar movimentações:', movError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados financeiros'
      });
    }

    // Buscar locações no período para contar locações ativas por mês
    const { data: locacoes, error: locError } = await supabase
      .from('locacoes')
      .select('id, data_locacao, data_entrega, status')
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim)
      .order('data_locacao', { ascending: true });

    if (locError) {
      console.error('Erro ao buscar locações:', locError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de locações'
      });
    }

    console.log('Locações encontradas no período:', locacoes?.length || 0);
    console.log('Período consultado:', inicio, 'a', fim);
    
    if (locacoes && locacoes.length > 0) {
      console.log('Primeiras 3 locações:');
      locacoes.slice(0, 3).forEach((loc, i) => {
        console.log(`${i + 1}:`, loc);
      });
    }

    // Buscar manutenções no período para incluir como despesas
    const { data: manutencoes, error: manutError } = await supabase
      .from('manutencoes')
      .select('data_manutencao, valor')
      .gte('data_manutencao', inicio)
      .lte('data_manutencao', fim);

    if (manutError) {
      console.error('Erro ao buscar manutenções:', manutError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de manutenções'
      });
    }

    // Agrupar dados por mês
    const dadosPorMes = {};

    // Função para inicializar um mês se não existir
    const inicializarMes = (chave, data) => {
      if (!dadosPorMes[chave]) {
        dadosPorMes[chave] = {
          mes: new Date(data.getFullYear(), data.getMonth()).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          }),
          receitas: 0,
          despesas: 0,
          lucro: 0,
          locacoes_ativas: 0
        };
      }
    };

    // Processar movimentações financeiras
    movimentacoes.forEach(mov => {
      const data = new Date(mov.data_movimentacao);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      inicializarMes(chave, data);

      if (mov.tipo === 'entrada') {
        dadosPorMes[chave].receitas += mov.valor;
      } else {
        dadosPorMes[chave].despesas += mov.valor;
      }
    });

    // Processar locações para contar quantas estão ativas em cada mês
    locacoes.forEach(locacao => {
      const dataInicio = new Date(locacao.data_locacao);
      const dataFim = locacao.data_entrega ? new Date(locacao.data_entrega) : new Date(); // Se não tem data de entrega, considera até hoje
      
      // Para cada mês no período, verificar se a locação estava ativa
      const inicioMes = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      const fimMes = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
      
      let mesAtual = new Date(inicioMes);
      
      while (mesAtual <= fimMes) {
        const chave = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
        
        // Verificar se este mês está no período solicitado
        const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
        const dataInicioPeriodo = new Date(inicio);
        const dataFimPeriodo = new Date(fim);
        
        // O mês está no período se há sobreposição entre o mês e o período solicitado
        const mesNoPeriodo = (primeiroDiaMes <= dataFimPeriodo && ultimoDiaMes >= dataInicioPeriodo);
        
        if (mesNoPeriodo) {
          inicializarMes(chave, mesAtual);
          
          // Verificar se a locação estava ativa durante este mês
          const locacaoAtivaNoMes = (
            dataInicio <= ultimoDiaMes && // Locação começou antes ou durante o mês
            dataFim >= primeiroDiaMes     // Locação terminou depois ou durante o mês
          );
          
          if (locacaoAtivaNoMes) {
            dadosPorMes[chave].locacoes_ativas++;
          }
        }
        
        // Próximo mês
        mesAtual.setMonth(mesAtual.getMonth() + 1);
      }
    });

    // Processar manutenções como despesas
    manutencoes.forEach(manutencao => {
      const data = new Date(manutencao.data_manutencao);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      inicializarMes(chave, data);
      dadosPorMes[chave].despesas += manutencao.valor;
    });

    // Calcular lucro e converter para array
    const relatorio = Object.values(dadosPorMes).map(item => ({
      ...item,
      lucro: item.receitas - item.despesas
    }));

    // Ordenar por mês
    relatorio.sort((a, b) => {
      const dataA = new Date(a.mes + ' 1, 2000');
      const dataB = new Date(b.mes + ' 1, 2000');
      return dataA - dataB;
    });

    return response.status(200).json({
      success: true,
      data: relatorio
    });

  } catch (error) {
    console.error('Erro no relatório financeiro:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}