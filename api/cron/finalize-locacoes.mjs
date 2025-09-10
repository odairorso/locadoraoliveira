import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Usar a SERVICE_KEY para ter permissões de escrita

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({ error: "Variáveis de ambiente do Supabase não configuradas." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // A data de hoje, no fuso horário UTC para consistência com o banco de dados
    const hoje = new Date().toISOString().split('T')[0];

    const { data, error, count } = await supabase
      .from('locacoes')
      .update({ 
        status: 'finalizada',
        updated_at: new Date().toISOString()
      })
      .lt('data_entrega', hoje) // lt = less than (menor que)
      .eq('status', 'ativa')
      .select(); // Adicionado select para que 'count' seja retornado

    if (error) {
      console.error('Erro ao finalizar locações:', error);
      throw error;
    }

    response.status(200).json({ 
      message: `Rotina executada com sucesso. ${count || 0} locações foram finalizadas.`,
      finalizadas: count || 0,
      data: data
    });

  } catch (error) {
    console.error("Erro na rotina de finalização:", error);
    response.status(500).json({ 
      error: "Erro interno do servidor ao executar a rotina.",
      details: error.message 
    });
  }
}