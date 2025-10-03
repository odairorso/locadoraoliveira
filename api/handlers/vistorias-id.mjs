import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getVistoria(req, res, id) {
  const { data: vistoria, error: vistoriaError } = await supabase
    .from('vistorias')
    .select(`
      *,
      clientes:cliente_id(nome, cpf, telefone),
      veiculos:veiculo_id(marca, modelo, placa, cor, ano)
    `)
    .eq('id', parseInt(id))
    .single();

  if (vistoriaError) {
    return res.status(404).json({
      success: false,
      error: 'Vistoria não encontrada'
    });
  }

  return res.status(200).json({
    success: true,
    data: vistoria
  });
}

async function updateVistoria(req, res, id) {
  const vistoriaData = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID da vistoria é obrigatório'
    });
  }

  const updateData = {};
  if (vistoriaData.quilometragem !== undefined) updateData.quilometragem = vistoriaData.quilometragem;
  if (vistoriaData.combustivel !== undefined) updateData.nivel_combustivel = vistoriaData.combustivel;
  if (vistoriaData.condutor !== undefined) updateData.nome_condutor = vistoriaData.condutor;
  if (vistoriaData.observacoes !== undefined) updateData.observacoes = vistoriaData.observacoes;
  if (vistoriaData.avariasJson !== undefined) updateData.avarias = vistoriaData.avariasJson;
  if (vistoriaData.assinaturaClienteUrl !== undefined) updateData.assinatura_cliente = vistoriaData.assinaturaClienteUrl;
  if (vistoriaData.assinaturaVistoriadorUrl !== undefined) updateData.assinatura_vistoriador = vistoriaData.assinaturaVistoriadorUrl;
  if (vistoriaData.nomeVistoriador !== undefined) updateData.nome_vistoriador = vistoriaData.nomeVistoriador;
  if (vistoriaData.fotos !== undefined) updateData.fotos = JSON.stringify(vistoriaData.fotos);
  if (vistoriaData.checklist) {
    // Mapeamento correto do checklist para colunas individuais
    const checklistMapping = {
      item_calota: 'item_calota',
      item_pneu: 'item_pneu',
      item_antena: 'item_antena',
      item_bateria: 'item_bateria',
      item_estepe: 'item_estepe',
      item_macaco: 'item_macaco',
      item_chave_roda: 'item_chave_roda',
      item_triangulo: 'item_triangulo',
      item_extintor: 'item_extintor',
      item_tapetes: 'item_tapetes',
      item_som: 'item_som',
      item_documentos: 'item_documentos',
      item_higienizacao: 'item_higienizacao'
    };
    
    Object.keys(checklistMapping).forEach(frontendKey => {
      const dbKey = checklistMapping[frontendKey];
      if (vistoriaData.checklist[frontendKey] !== undefined) {
        updateData[dbKey] = vistoriaData.checklist[frontendKey];
      }
    });
  }
  updateData.updated_at = new Date().toISOString();

  const { data: updatedVistoria, error } = await supabase
    .from('vistorias')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar vistoria:", error);
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, data: updatedVistoria });
}

async function deleteVistoria(req, res, id) {
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID da vistoria é obrigatório'
    });
  }

  const { error } = await supabase
    .from('vistorias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar vistoria:", error);
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, message: 'Vistoria excluída com sucesso' });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { id } = req.query; // Vercel insere o parâmetro [id] em req.query

  try {
    switch (method) {
      case 'GET':
        await getVistoria(req, res, id);
        break;
      case 'PUT':
        await updateVistoria(req, res, id);
        break;
      case 'DELETE':
        await deleteVistoria(req, res, id);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ success: false, error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error(`Erro na API de vistorias para ID ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
