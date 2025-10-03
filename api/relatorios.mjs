import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { tipo } = req.query;

    switch (tipo) {
      case 'clientes':
        return await handleClientesReport(req, res);
      case 'financeiro':
        return await handleFinanceiroReport(req, res);
      case 'locacoes':
        return await handleLocacoesReport(req, res);
      case 'veiculos':
        return await handleVeiculosReport(req, res);
      case 'despesas':
        return await handleDespesasReport(req, res);
      default:
        return res.status(400).json({ error: 'Tipo de relatório não especificado ou inválido' });
    }
  } catch (error) {
    console.error('Erro no relatório:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleClientesReport(req, res) {
  const { periodo_inicio, periodo_fim } = req.query;

  try {
    let query = supabase
      .from('clientes')
      .select(`
        id,
        nome,
        email,
        celular,
        cpf,
        created_at,
        locacoes:locacoes(
          id,
          data_locacao,
          data_entrega,
          valor_total,
          status
        )
      `);

    if (periodo_inicio && periodo_fim) {
      query = query.gte('created_at', periodo_inicio).lte('created_at', periodo_fim);
    }

    const { data: clientes, error } = await query;

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados dos clientes' });
    }

    // Processar dados dos clientes
    const clientesProcessados = clientes.map(cliente => {
      const totalLocacoes = cliente.locacoes.length;
      const valorTotalGasto = cliente.locacoes.reduce((sum, locacao) => sum + (locacao.valor_total || 0), 0);
      const locacoesAtivas = cliente.locacoes.filter(l => l.status === 'ativa').length;

      return {
        ...cliente,
        total_locacoes: totalLocacoes,
        valor_total_gasto: valorTotalGasto,
        locacoes_ativas: locacoesAtivas,
        ultima_locacao: cliente.locacoes.length > 0 ? 
          Math.max(...cliente.locacoes.map(l => new Date(l.data_locacao).getTime())) : null
      };
    });

    return res.status(200).json(clientesProcessados);
  } catch (error) {
    console.error('Erro no relatório de clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleFinanceiroReport(req, res) {
  const { periodo_inicio, periodo_fim } = req.query;

  try {
    // Buscar movimentações financeiras
    let queryMovimentacoes = supabase
      .from('movimentacoes_financeiras')
      .select('*');

    if (periodo_inicio && periodo_fim) {
      queryMovimentacoes = queryMovimentacoes
        .gte('data', periodo_inicio)
        .lte('data', periodo_fim);
    }

    const { data: movimentacoes, error: errorMovimentacoes } = await queryMovimentacoes;

    if (errorMovimentacoes) {
      console.error('Erro ao buscar movimentações:', errorMovimentacoes);
      return res.status(500).json({ error: 'Erro ao buscar movimentações financeiras' });
    }

    // Calcular totais
    const receitas = movimentacoes.filter(m => m.tipo === 'receita');
    const despesas = movimentacoes.filter(m => m.tipo === 'despesa');

    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
    const lucroLiquido = totalReceitas - totalDespesas;

    // Agrupar por categoria
    const receitasPorCategoria = receitas.reduce((acc, r) => {
      acc[r.categoria] = (acc[r.categoria] || 0) + r.valor;
      return acc;
    }, {});

    const despesasPorCategoria = despesas.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {});

    // Evolução mensal
    const evolucaoMensal = movimentacoes.reduce((acc, mov) => {
      const data = new Date(mov.data);
      if (isNaN(data.getTime())) {
        console.warn('Data inválida encontrada:', mov.data);
        return acc;
      }
      const mes = data.toISOString().substring(0, 7);
      if (!acc[mes]) {
        acc[mes] = { receitas: 0, despesas: 0 };
      }
      if (mov.tipo === 'receita') {
        acc[mes].receitas += mov.valor;
      } else {
        acc[mes].despesas += mov.valor;
      }
      return acc;
    }, {});

    return res.status(200).json({
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        lucro_liquido: lucroLiquido
      },
      receitas_por_categoria: receitasPorCategoria,
      despesas_por_categoria: despesasPorCategoria,
      evolucao_mensal: Object.entries(evolucaoMensal).map(([mes, dados]) => ({
        mes,
        receitas: dados.receitas,
        despesas: dados.despesas,
        lucro: dados.receitas - dados.despesas
      })),
      movimentacoes
    });
  } catch (error) {
    console.error('Erro no relatório financeiro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleLocacoesReport(req, res) {
  const { periodo_inicio, periodo_fim, status, veiculo_id } = req.query;

  try {
    let query = supabase
      .from('locacoes')
      .select(`
        *,
        cliente:clientes(nome, email, celular),
        veiculo:veiculos(marca, modelo, placa, ano)
      `);

    if (periodo_inicio && periodo_fim) {
      query = query.gte('data_locacao', periodo_inicio).lte('data_entrega', periodo_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (veiculo_id) {
      query = query.eq('veiculo_id', veiculo_id);
    }

    const { data: locacoes, error } = await query.order('data_locacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar locações:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados das locações' });
    }

    // Estatísticas
    const totalLocacoes = locacoes.length;
    const valorTotal = locacoes.reduce((sum, l) => sum + (l.valor_total || 0), 0);
    const valorMedio = totalLocacoes > 0 ? valorTotal / totalLocacoes : 0;

    const statusDistribution = locacoes.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    // Duração média das locações
    const duracaoMedia = locacoes.reduce((sum, l) => {
      const inicio = new Date(l.data_locacao);
      const fim = new Date(l.data_entrega);
      const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
      return sum + dias;
    }, 0) / totalLocacoes;

    return res.status(200).json({
      estatisticas: {
        total_locacoes: totalLocacoes,
        valor_total_periodo: valorTotal,
        valor_medio_locacao: valorMedio,
        duracao_media_dias: Math.round(duracaoMedia || 0),
        distribuicao_status: statusDistribution
      },
      locacoes
    });
  } catch (error) {
    console.error('Erro no relatório de locações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleVeiculosReport(req, res) {
  const { periodo_inicio, periodo_fim } = req.query;

  try {
    let queryLocacoes = supabase
      .from('locacoes')
      .select(`
        veiculo_id,
        valor_total,
        data_locacao,
        data_entrega,
        status,
        veiculo:veiculos(marca, modelo, placa, ano, cor)
      `);

    if (periodo_inicio && periodo_fim) {
      queryLocacoes = queryLocacoes
        .gte('data_locacao', periodo_inicio)
        .lte('data_entrega', periodo_fim);
    }

    const { data: locacoes, error: errorLocacoes } = await queryLocacoes;

    if (errorLocacoes) {
      console.error('Erro ao buscar locações:', errorLocacoes);
      return res.status(500).json({ error: 'Erro ao buscar dados das locações' });
    }

    // Buscar manutenções
    let queryManutencoes = supabase
      .from('manutencoes')
      .select(`
        veiculo_id,
        custo,
        data_manutencao,
        veiculo:veiculos(marca, modelo, placa)
      `);

    if (periodo_inicio && periodo_fim) {
      queryManutencoes = queryManutencoes
        .gte('data_manutencao', periodo_inicio)
        .lte('data_manutencao', periodo_fim);
    }

    const { data: manutencoes, error: errorManutencoes } = await queryManutencoes;

    if (errorManutencoes) {
      console.error('Erro ao buscar manutenções:', errorManutencoes);
      return res.status(500).json({ error: 'Erro ao buscar dados das manutenções' });
    }

    // Processar dados por veículo
    const veiculosMap = {};

    // Processar locações
    locacoes.forEach(locacao => {
      const veiculoId = locacao.veiculo_id;
      if (!veiculosMap[veiculoId]) {
        veiculosMap[veiculoId] = {
          veiculo: locacao.veiculo,
          total_locacoes: 0,
          receita_total: 0,
          custo_manutencao: 0,
          lucro_liquido: 0
        };
      }
      veiculosMap[veiculoId].total_locacoes++;
      veiculosMap[veiculoId].receita_total += locacao.valor_total || 0;
    });

    // Processar manutenções
    manutencoes.forEach(manutencao => {
      const veiculoId = manutencao.veiculo_id;
      if (!veiculosMap[veiculoId]) {
        veiculosMap[veiculoId] = {
          veiculo: manutencao.veiculo,
          total_locacoes: 0,
          receita_total: 0,
          custo_manutencao: 0,
          lucro_liquido: 0
        };
      }
      veiculosMap[veiculoId].custo_manutencao += manutencao.custo || 0;
    });

    // Calcular lucro líquido
    Object.values(veiculosMap).forEach(veiculo => {
      veiculo.lucro_liquido = veiculo.receita_total - veiculo.custo_manutencao;
    });

    const veiculosArray = Object.values(veiculosMap);

    return res.status(200).json({
      veiculos: veiculosArray,
      resumo: {
        total_veiculos: veiculosArray.length,
        receita_total: veiculosArray.reduce((sum, v) => sum + v.receita_total, 0),
        custo_total_manutencao: veiculosArray.reduce((sum, v) => sum + v.custo_manutencao, 0),
        lucro_total: veiculosArray.reduce((sum, v) => sum + v.lucro_liquido, 0)
      }
    });
  } catch (error) {
    console.error('Erro no relatório de veículos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleDespesasReport(req, res) {
  const { periodo_inicio, periodo_fim, veiculo_id, tipo_manutencao } = req.query;

  try {
    // Query base para buscar manutenções com informações do veículo
    let query = supabase
      .from('manutencoes')
      .select(`
        id,
        data_manutencao,
        tipo_manutencao,
        valor,
        descricao,
        created_at,
        veiculos (
          id,
          marca,
          modelo,
          placa,
          ano
        )
      `)
      .order('data_manutencao', { ascending: false });

    // Aplicar filtros
    if (periodo_inicio && periodo_fim) {
      query = query.gte('data_manutencao', periodo_inicio).lte('data_manutencao', periodo_fim);
    }

    if (veiculo_id) {
      query = query.eq('veiculo_id', veiculo_id);
    }

    if (tipo_manutencao) {
      query = query.eq('tipo_manutencao', tipo_manutencao);
    }

    const { data: manutencoes, error } = await query;

    if (error) {
      console.error('Erro ao buscar manutenções:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados de manutenções' });
    }

    // Processar dados para o relatório
    const despesasPorMes = {};
    const despesasPorVeiculo = {};
    const despesasPorTipo = {};
    let totalGeral = 0;

    manutencoes.forEach(manutencao => {
      const valor = parseFloat(manutencao.valor) || 0;
      totalGeral += valor;

      // Agrupar por mês
      const mes = new Date(manutencao.data_manutencao).toISOString().substring(0, 7); // YYYY-MM
      if (!despesasPorMes[mes]) {
        despesasPorMes[mes] = { mes, total: 0, quantidade: 0 };
      }
      despesasPorMes[mes].total += valor;
      despesasPorMes[mes].quantidade += 1;

      // Agrupar por veículo
      const veiculoKey = `${manutencao.veiculos.marca} ${manutencao.veiculos.modelo} (${manutencao.veiculos.placa})`;
      if (!despesasPorVeiculo[veiculoKey]) {
        despesasPorVeiculo[veiculoKey] = {
          veiculo: manutencao.veiculos,
          total: 0,
          quantidade: 0,
          manutencoes: []
        };
      }
      despesasPorVeiculo[veiculoKey].total += valor;
      despesasPorVeiculo[veiculoKey].quantidade += 1;
      despesasPorVeiculo[veiculoKey].manutencoes.push(manutencao);

      // Agrupar por tipo de manutenção
      if (!despesasPorTipo[manutencao.tipo_manutencao]) {
        despesasPorTipo[manutencao.tipo_manutencao] = {
          tipo: manutencao.tipo_manutencao,
          total: 0,
          quantidade: 0
        };
      }
      despesasPorTipo[manutencao.tipo_manutencao].total += valor;
      despesasPorTipo[manutencao.tipo_manutencao].quantidade += 1;
    });

    // Converter objetos em arrays e ordenar
    const despesasPorMesArray = Object.values(despesasPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
    const despesasPorVeiculoArray = Object.values(despesasPorVeiculo).sort((a, b) => b.total - a.total);
    const despesasPorTipoArray = Object.values(despesasPorTipo).sort((a, b) => b.total - a.total);

    // Transformar dados para o formato esperado pelo frontend
    const dadosFormatados = manutencoes.map(manutencao => ({
      id: manutencao.id,
      veiculo: `${manutencao.veiculos.marca} ${manutencao.veiculos.modelo}`,
      placa: manutencao.veiculos.placa,
      data_manutencao: manutencao.data_manutencao,
      tipo_manutencao: manutencao.tipo_manutencao,
      valor: parseFloat(manutencao.valor),
      descricao: manutencao.descricao
    }));

    // Estatísticas no formato esperado pelo frontend
    const estatisticas = {
      total_despesas: manutencoes.length,
      valor_total_periodo: totalGeral,
      valor_medio_manutencao: manutencoes.length > 0 ? totalGeral / manutencoes.length : 0,
      total_manutencoes: manutencoes.length,
      distribuicao_por_tipo: despesasPorTipoArray.map(item => ({
        tipo: item.tipo,
        quantidade: item.quantidade,
        valor_total: item.total
      })),
      evolucao_mensal: despesasPorMesArray.map(item => ({
        mes: item.mes,
        total_manutencoes: item.quantidade,
        valor_total: item.total
      })),
      despesas_por_veiculo: despesasPorVeiculoArray.map(item => ({
        veiculo: `${item.veiculo.marca} ${item.veiculo.modelo}`,
        placa: item.veiculo.placa,
        total_manutencoes: item.quantidade,
        valor_total: item.total
      }))
    };

    return res.status(200).json({
      data: dadosFormatados,
      estatisticas: estatisticas,
      // Manter dados originais para compatibilidade
      manutencoes,
      resumo: {
        total_geral: totalGeral,
        quantidade_total: manutencoes.length,
        valor_medio: manutencoes.length > 0 ? totalGeral / manutencoes.length : 0,
        periodo: {
          inicio: periodo_inicio,
          fim: periodo_fim
        }
      },
      despesas_por_mes: despesasPorMesArray,
      despesas_por_veiculo: despesasPorVeiculoArray,
      despesas_por_tipo: despesasPorTipoArray
    });
  } catch (error) {
    console.error('Erro no relatório de despesas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}