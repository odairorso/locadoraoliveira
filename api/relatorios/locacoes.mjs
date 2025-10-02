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

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({
        success: false,
        error: "Variáveis de ambiente do Supabase não configuradas.",
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

    // Buscar todas as locações no período
    const { data: locacoes, error: locError } = await supabase
      .from('locacoes')
      .select(`
        *,
        clientes (
          nome
        ),
        veiculos (
          marca,
          modelo,
          placa
        )
      `)
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim)
      .order('data_locacao', { ascending: false });

    if (locError) {
      console.error('Erro ao buscar locações:', locError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de locações'
      });
    }

    // Agrupar por status
    const statusCount = {
      ativa: 0,
      finalizada: 0,
      cancelada: 0,
      pendente: 0
    };

    // Calcular estatísticas
    let valorTotalPeriodo = 0;
    let diasTotalLocacao = 0;

    const locacoesDetalhadas = locacoes.map(locacao => {
      // Contar por status
      if (statusCount.hasOwnProperty(locacao.status)) {
        statusCount[locacao.status]++;
      }

      // Calcular valor total
      valorTotalPeriodo += locacao.valor_total;

      // Calcular dias de locação
      const dataInicio = new Date(locacao.data_locacao);
      const dataFim = new Date(locacao.data_entrega);
      const diasLocacao = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
      diasTotalLocacao += diasLocacao;

      return {
        id: locacao.id,
        cliente: locacao.clientes?.nome || 'Cliente não encontrado',
        veiculo: `${locacao.veiculos?.marca || ''} ${locacao.veiculos?.modelo || ''} - ${locacao.veiculos?.placa || ''}`.trim(),
        data_locacao: locacao.data_locacao,
        data_entrega: locacao.data_entrega,
        valor_total: locacao.valor_total,
        status: locacao.status,
        dias_locacao: diasLocacao,
        observacoes: locacao.observacoes
      };
    });

    // Calcular estatísticas gerais
    const estatisticas = {
      total_locacoes: locacoes.length,
      valor_total_periodo: valorTotalPeriodo,
      valor_medio_locacao: locacoes.length > 0 ? valorTotalPeriodo / locacoes.length : 0,
      dias_medio_locacao: locacoes.length > 0 ? diasTotalLocacao / locacoes.length : 0,
      distribuicao_status: statusCount
    };

    // Agrupar por mês para análise temporal
    const locacoesPorMes = {};
    locacoes.forEach(locacao => {
      const data = new Date(locacao.data_locacao);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!locacoesPorMes[chave]) {
        locacoesPorMes[chave] = {
          mes: new Date(data.getFullYear(), data.getMonth()).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          }),
          quantidade: 0,
          valor_total: 0
        };
      }

      locacoesPorMes[chave].quantidade++;
      locacoesPorMes[chave].valor_total += locacao.valor_total;
    });

    const evolucaoMensal = Object.values(locacoesPorMes).sort((a, b) => {
      const dataA = new Date(a.mes + ' 1, 2000');
      const dataB = new Date(b.mes + ' 1, 2000');
      return dataA - dataB;
    });

    return response.status(200).json({
      success: true,
      data: locacoesDetalhadas,
      estatisticas,
      evolucao_mensal: evolucaoMensal
    });

  } catch (error) {
    console.error('Erro no relatório de locações:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}