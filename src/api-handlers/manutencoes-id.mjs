import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Buscar manutenção específica
async function getManutencao(req, res, id) {
  const { data, error } = await supabase
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
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar manutenção:', error);
    return res.status(400).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: 'Manutenção não encontrada' });
  }

  res.status(200).json({ success: true, data });
}

// Atualizar manutenção
async function updateManutencao(req, res, id) {
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID da manutenção é obrigatório' });
  }

  const { veiculo_id, data_manutencao, tipo_manutencao, valor, descricao } = req.body;

  // Validações
  if (valor !== undefined && (isNaN(valor) || parseFloat(valor) < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Valor deve ser um número positivo'
    });
  }

  // Verificar se o veículo existe (se foi fornecido)
  if (veiculo_id) {
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
  }

  const updateData = {};
  if (veiculo_id !== undefined) updateData.veiculo_id = parseInt(veiculo_id);
  if (data_manutencao !== undefined) updateData.data_manutencao = data_manutencao;
  if (tipo_manutencao !== undefined) updateData.tipo_manutencao = tipo_manutencao.trim();
  if (valor !== undefined) updateData.valor = parseFloat(valor);
  if (descricao !== undefined) updateData.descricao = descricao?.trim() || null;

  const { data, error } = await supabase
    .from('manutencoes')
    .update(updateData)
    .eq('id', id)
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
    console.error('Erro ao atualizar manutenção:', error);
    return res.status(400).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: 'Manutenção não encontrada' });
  }

  res.status(200).json({ success: true, data });
}

// Deletar manutenção
async function deleteManutencao(req, res, id) {
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID da manutenção é obrigatório' });
  }

  const { data, error } = await supabase
    .from('manutencoes')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao deletar manutenção:', error);
    return res.status(400).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: 'Manutenção não encontrada' });
  }

  res.status(200).json({ success: true, message: 'Manutenção deletada com sucesso' });
}


export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // Vercel insere o parâmetro [id] em req.query

  try {
    switch (method) {
      case 'GET':
        await getManutencao(req, res, id);
        break;

      case 'PUT':
        await updateManutencao(req, res, id);
        break;

      case 'DELETE':
        await deleteManutencao(req, res, id);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ success: false, error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error(`Erro na API de manutenções para ID ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
