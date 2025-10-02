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
    const { inicio, fim, veiculo_id } = request.query;

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
        veiculos (
          id,
          marca,
          modelo,
          placa
        )
      `)
      .gte('data_locacao', inicio)
      .lte('data_locacao', fim);

    // Filtrar por veículo específico se fornecido
    if (veiculo_id) {
      locacoesQuery = locacoesQuery.eq('veiculo_id', parseInt(veiculo_id));
    }

    const { data: locacoes, error: locError } = await locacoesQuery;

    if (locError) {
      console.error('Erro ao buscar locações:', locError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de locações'
      });
    }

    // Buscar manutenções no período para calcular custos por veículo
    let manutencoesQuery = supabase
      .from('manutencoes')
      .select('veiculo_id, valor')
      .gte('data_manutencao', inicio)
      .lte('data_manutencao', fim);

    // Filtrar por veículo específico se fornecido
    if (veiculo_id) {
      manutencoesQuery = manutencoesQuery.eq('veiculo_id', parseInt(veiculo_id));
    }

    const { data: manutencoes, error: manutError } = await manutencoesQuery;

    if (manutError) {
      console.error('Erro ao buscar manutenções:', manutError);
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de manutenções'
      });
    }

    // Agrupar dados por veículo
    const dadosPorVeiculo = {};

    locacoes.forEach(locacao => {
      const veiculoId = locacao.veiculo_id;
      const veiculo = locacao.veiculos;

      if (!dadosPorVeiculo[veiculoId]) {
        dadosPorVeiculo[veiculoId] = {
          id: veiculoId,
          marca: veiculo.marca,
          modelo: veiculo.modelo,
          placa: veiculo.placa,
          total_locacoes: 0,
          receita_total: 0,
          custo_manutencao: 0,
          lucro_liquido: 0,
          dias_locado: 0,
          taxa_ocupacao: 0
        };
      }

      dadosPorVeiculo[veiculoId].total_locacoes++;
      dadosPorVeiculo[veiculoId].receita_total += locacao.valor_total;

      // Calcular dias locado
      const dataInicio = new Date(locacao.data_locacao);
      const dataFim = new Date(locacao.data_entrega);
      const diasLocacao = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
      dadosPorVeiculo[veiculoId].dias_locado += diasLocacao;
    });

    // Processar manutenções por veículo
    manutencoes.forEach(manutencao => {
      const veiculoId = manutencao.veiculo_id;
      
      if (dadosPorVeiculo[veiculoId]) {
        dadosPorVeiculo[veiculoId].custo_manutencao += manutencao.valor;
      }
    });

    // Calcular lucro líquido para cada veículo
    Object.values(dadosPorVeiculo).forEach(veiculo => {
      veiculo.lucro_liquido = veiculo.receita_total - veiculo.custo_manutencao;
    });

    // Calcular taxa de ocupação
    const dataInicioCalculo = new Date(inicio);
    const dataFimCalculo = new Date(fim);
    const totalDiasPeriodo = Math.ceil((dataFimCalculo - dataInicioCalculo) / (1000 * 60 * 60 * 24));

    Object.values(dadosPorVeiculo).forEach(veiculo => {
      veiculo.taxa_ocupacao = totalDiasPeriodo > 0 ? (veiculo.dias_locado / totalDiasPeriodo) * 100 : 0;
    });

    // Converter para array e ordenar por lucro líquido (decrescente)
    const relatorio = Object.values(dadosPorVeiculo).sort((a, b) => b.lucro_liquido - a.lucro_liquido);

    return response.status(200).json({
      success: true,
      data: relatorio
    });

  } catch (error) {
    console.error('Erro no relatório de veículos:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}