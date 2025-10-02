import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

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
    switch (req.method) {
      case 'GET':
        return await getVistorias(req, res);
      case 'POST':
        return await createVistoria(req, res);
      case 'PUT':
        return await updateVistoria(req, res);
      case 'DELETE':
        return await deleteVistoria(req, res);
      default:
        return res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API de vistorias:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}

async function getVistorias(req, res) {
  const { id, veiculo_id, cliente_id, locacao_id, tipo_vistoria } = req.query;

  let query = supabase
    .from('vistorias')
    .select(`
      *,
      clientes:cliente_id(nome, cpf, celular),
      veiculos:veiculo_id(marca, modelo, placa, cor),
      locacoes:locacao_id(data_locacao, data_entrega, status)
    `)
    .order('created_at', { ascending: false });

  if (id) {
    query = query.eq('id', id);
  }
  if (veiculo_id) {
    query = query.eq('veiculo_id', veiculo_id);
  }
  if (cliente_id) {
    query = query.eq('cliente_id', cliente_id);
  }
  if (locacao_id) {
    query = query.eq('locacao_id', locacao_id);
  }
  if (tipo_vistoria) {
    query = query.eq('tipo_vistoria', tipo_vistoria);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar vistorias:', error);
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}

async function createVistoria(req, res) {
  const vistoriaData = req.body;

  // Validações básicas
  if (!vistoriaData.veiculo_id || !vistoriaData.cliente_id) {
    return res.status(400).json({ 
      error: 'Veículo e cliente são obrigatórios' 
    });
  }

  if (!vistoriaData.tipo_vistoria || !['entrada', 'saida'].includes(vistoriaData.tipo_vistoria)) {
    return res.status(400).json({ 
      error: 'Tipo de vistoria deve ser "entrada" ou "saida"' 
    });
  }

  // Adicionar valores padrão para campos opcionais
  const vistoriaCompleta = {
    ...vistoriaData,
    nome_condutor: vistoriaData.nome_condutor || null,
    rg_condutor: vistoriaData.rg_condutor || null,
    locacao_id: vistoriaData.locacao_id || null,
    observacoes: vistoriaData.observacoes || null,
    assinatura_cliente: vistoriaData.assinatura_cliente || null,
    assinatura_vistoriador: vistoriaData.assinatura_vistoriador || null
  };

  // Converter avarias para JSON string se for array
  if (Array.isArray(vistoriaCompleta.avarias)) {
    vistoriaCompleta.avarias = JSON.stringify(vistoriaCompleta.avarias);
  }

  const { data, error } = await supabase
    .from('vistorias')
    .insert([vistoriaCompleta])
    .select(`
      *,
      clientes:cliente_id(nome, cpf, celular),
      veiculos:veiculo_id(marca, modelo, placa, cor),
      locacoes:locacao_id(data_locacao, data_entrega, status)
    `);

  if (error) {
    console.error('Erro ao criar vistoria:', error);
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ 
    success: true, 
    data: data[0],
    message: 'Vistoria criada com sucesso' 
  });
}

async function updateVistoria(req, res) {
  const { id } = req.query;
  const vistoriaData = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da vistoria é obrigatório' });
  }

  // Converter avarias para JSON string se for array
  if (Array.isArray(vistoriaData.avarias)) {
    vistoriaData.avarias = JSON.stringify(vistoriaData.avarias);
  }

  const { data, error } = await supabase
    .from('vistorias')
    .update(vistoriaData)
    .eq('id', id)
    .select(`
      *,
      clientes:cliente_id(nome, cpf, celular),
      veiculos:veiculo_id(marca, modelo, placa, cor),
      locacoes:locacao_id(data_locacao, data_entrega, status)
    `);

  if (error) {
    console.error('Erro ao atualizar vistoria:', error);
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Vistoria não encontrada' });
  }

  return res.status(200).json({ 
    success: true, 
    data: data[0],
    message: 'Vistoria atualizada com sucesso' 
  });
}

async function deleteVistoria(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da vistoria é obrigatório' });
  }

  const { data, error } = await supabase
    .from('vistorias')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error('Erro ao deletar vistoria:', error);
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Vistoria não encontrada' });
  }

  return res.status(200).json({ 
    success: true, 
    message: 'Vistoria deletada com sucesso' 
  });
}