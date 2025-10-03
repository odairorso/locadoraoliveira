import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Listar todas as manutenções com informações do veículo
async function getManutencoes(req, res) {
  const { veiculo_id, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('manutencoes')
    .select(`
      *,
      veiculos (
        id,
        marca,
        modelo,
        placa,
        ano
      )
    `)
    .order('data_manutencao', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtrar por veículo se especificado
  if (veiculo_id) {
    query = query.eq('veiculo_id', veiculo_id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao buscar manutenções:', error);
    return res.status(400).json({ success: false, error: error.message });
  }

  // Buscar resumo de gastos por veículo
  const { data: resumoData, error: resumoError } = await supabase
    .from('manutencoes')
    .select(`
      veiculo_id,
      veiculos (
        id,
        marca,
        modelo,
        placa
      )
    `)
    .order('veiculo_id');

  let resumoPorVeiculo = {};
  if (!resumoError && resumoData) {
    // Calcular total por veículo
    const { data: totaisData } = await supabase
      .rpc('calcular_total_manutencao_por_veiculo');

    if (totaisData) {
      resumoPorVeiculo = totaisData.reduce((acc, item) => {
        acc[item.veiculo_id] = {
          veiculo: item.veiculo_info,
          total: parseFloat(item.total_gasto) || 0,
          quantidade: parseInt(item.quantidade_manutencoes) || 0
        };
        return acc;
      }, {});
    }
  }

  res.status(200).json({
    success: true,
    data: data || [],
    resumoPorVeiculo,
    total: count || data?.length || 0
  });
}

// Criar nova manutenção
async function createManutencao(req, res) {
  const { veiculo_id, data_manutencao, tipo_manutencao, valor, descricao } = req.body;

  // Validações
  if (!veiculo_id || !data_manutencao || !tipo_manutencao || !valor) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: veiculo_id, data_manutencao, tipo_manutencao, valor'
    });
  }

  if (isNaN(valor) || parseFloat(valor) < 0) {
    return res.status(400).json({
      success: false,
      error: 'Valor deve ser um número positivo'
    });
  }

  // Verificar se o veículo existe
  const { data: veiculo, error: veiculoError } = await supabase
    .from('veiculos')
    .select('id')
    .eq('id', veiculo_id)
    .single();

  if (veiculoError || !veiculo) {
    return res.status(400).json({
      success: false,
      error: 'Veículo não encontrado'
    });
  }

  const { data, error } = await supabase
    .from('manutencoes')
    .insert([{
      veiculo_id: parseInt(veiculo_id),
      data_manutencao,
      tipo_manutencao: tipo_manutencao.trim(),
      valor: parseFloat(valor),
      descricao: descricao?.trim() || null
    }])
    .select(`
      *,
      veiculos (
        id,
        marca,
        modelo,
        placa,
        ano
      )
    `)
    .single();

  if (error) {
    console.error('Erro ao criar manutenção:', error);
    return res.status(400).json({ success: false, error: error.message });
  }

  res.status(201).json({ success: true, data });
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await getManutencoes(req, res);
        break;

      case 'POST':
        await createManutencao(req, res);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ success: false, error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro na API de manutenções (index):', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}