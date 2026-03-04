import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para finalizar uma locação quando a vistoria de entrada é concluída
export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ success: false, error: `Method ${request.method} Not Allowed` });
  }

  try {
    const { vistoria_id } = request.body;

    if (!vistoria_id) {
      return response.status(400).json({ success: false, error: 'ID da vistoria é obrigatório' });
    }

    // Buscar a vistoria
    const { data: vistoria, error: vistoriaError } = await supabase
      .from('vistorias')
      .select('locacao_id, tipo_vistoria')
      .eq('id', vistoria_id)
      .single();

    if (vistoriaError) {
      console.error('Erro ao buscar vistoria:', vistoriaError);
      return response.status(400).json({ success: false, error: 'Erro ao buscar vistoria' });
    }

    // Verificar se é uma vistoria de entrada
    if (vistoria.tipo_vistoria !== 'entrada') {
      return response.status(400).json({ success: false, error: 'Apenas vistorias de entrada podem finalizar uma locação' });
    }

    if (!vistoria.locacao_id) {
      return response.status(400).json({ success: false, error: 'Vistoria não está associada a uma locação' });
    }

    // Atualizar o status da locação para "finalizada"
    const { data: locacaoAtualizada, error: locacaoError } = await supabase
      .from('locacoes')
      .update({ status: 'finalizada' })
      .eq('id', vistoria.locacao_id)
      .select()
      .single();

    if (locacaoError) {
      console.error('Erro ao finalizar locação:', locacaoError);
      return response.status(400).json({ success: false, error: 'Erro ao finalizar locação' });
    }

    // Atualizar o status do veículo para "disponivel"
    const { error: veiculoError } = await supabase
      .from('veiculos')
      .update({ status: 'disponivel' })
      .eq('id', locacaoAtualizada.veiculo_id);

    if (veiculoError) {
      console.error('Erro ao atualizar status do veículo:', veiculoError);
      // Não retornamos erro aqui pois a locação já foi finalizada
    }

    return response.status(200).json({ 
      success: true, 
      data: { 
        message: 'Locação finalizada com sucesso',
        locacao: locacaoAtualizada
      } 
    });

  } catch (error) {
    console.error("Erro na função finalizar-locacao-vistoria:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}