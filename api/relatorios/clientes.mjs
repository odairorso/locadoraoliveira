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
    const { inicio, fim, cliente_id } = request.query;

    if (!inicio || !fim) {
      return response.status(400).json({
        success: false,
        error: "Parâmetros 'inicio' e 'fim' são obrigatórios"
      });
    }

    // Construir query base para locações
    let locacoesQuery = supabase
      .from('locacoes')
      .select(`
        *,
        clientes (
          id,
          nome,
          cpf,
          celular,
          email
        )
      `)
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim);

    // Filtrar por cliente específico se fornecido
    if (cliente_id) {
      locacoesQuery = locacoesQuery.eq('cliente_id', parseInt(cliente_id));
    }

    const { data: locacoes, error: locError } = await locacoesQuery;

    if (locError) {
      console.error('Erro ao buscar locações:', locError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de locações'
      });
    }

    // Agrupar dados por cliente
    const dadosPorCliente = {};

    locacoes.forEach(locacao => {
      const clienteId = locacao.cliente_id;
      const cliente = locacao.clientes;

      if (!dadosPorCliente[clienteId]) {
        dadosPorCliente[clienteId] = {
          id: clienteId,
          nome: cliente.nome,
          cpf: cliente.cpf,
          celular: cliente.celular,
          email: cliente.email,
          total_locacoes: 0,
          valor_total_gasto: 0,
          valor_medio_locacao: 0,
          ultima_locacao: null,
          status_cliente: 'ativo'
        };
      }

      dadosPorCliente[clienteId].total_locacoes++;
      dadosPorCliente[clienteId].valor_total_gasto += locacao.valor_total;

      // Atualizar última locação
      const dataLocacao = new Date(locacao.data_locacao);
      if (!dadosPorCliente[clienteId].ultima_locacao || 
          dataLocacao > new Date(dadosPorCliente[clienteId].ultima_locacao)) {
        dadosPorCliente[clienteId].ultima_locacao = locacao.data_locacao;
      }
    });

    // Calcular valor médio e determinar status do cliente
    const agora = new Date();
    const trintaDiasAtras = new Date(agora.getTime() - (30 * 24 * 60 * 60 * 1000));

    Object.values(dadosPorCliente).forEach(cliente => {
      cliente.valor_medio_locacao = cliente.total_locacoes > 0 ? 
        cliente.valor_total_gasto / cliente.total_locacoes : 0;

      // Determinar status do cliente baseado na última locação
      if (cliente.ultima_locacao) {
        const ultimaLocacao = new Date(cliente.ultima_locacao);
        if (ultimaLocacao < trintaDiasAtras) {
          cliente.status_cliente = 'inativo';
        }
      }
    });

    // Converter para array e ordenar por valor total gasto (decrescente)
    const relatorio = Object.values(dadosPorCliente).sort((a, b) => b.valor_total_gasto - a.valor_total_gasto);

    // Calcular estatísticas gerais
    const estatisticas = {
      total_clientes: relatorio.length,
      clientes_ativos: relatorio.filter(c => c.status_cliente === 'ativo').length,
      clientes_inativos: relatorio.filter(c => c.status_cliente === 'inativo').length,
      receita_total: relatorio.reduce((sum, c) => sum + c.valor_total_gasto, 0),
      ticket_medio: relatorio.length > 0 ? 
        relatorio.reduce((sum, c) => sum + c.valor_medio_locacao, 0) / relatorio.length : 0
    };

    return response.status(200).json({
      success: true,
      data: relatorio,
      estatisticas
    });

  } catch (error) {
    console.error('Erro no relatório de clientes:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}