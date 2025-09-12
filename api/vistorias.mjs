import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;

    if (method === 'POST') {
      const {
        clienteId,
        veiculoId,
        tipoVistoria, // 'entrada' or 'saida'
        quilometragem,
        condutor,
        telefone,
        combustivel,
        observacoes,
        checklist,
        avariasJson,
        assinaturaClienteUrl,
        assinaturaVistoriadorUrl,
      } = request.body;

      // Basic validation
      if (!clienteId || !veiculoId || !tipoVistoria || quilometragem === undefined || !combustivel) {
        return response.status(400).json({ success: false, error: 'Missing required fields.' });
      }

      // Map checklist object to individual columns (assuming frontend sends keys matching DB columns)
      const checklistData = {};
      for (const key in checklist) {
        checklistData[key] = checklist[key];
      }

      const { data: newVistoria, error } = await supabase
        .from('vistorias')
        .insert([
          {
            cliente_id: clienteId,
            veiculo_id: veiculoId,
            tipo_vistoria: tipoVistoria,
            quilometragem: quilometragem,
            condutor: condutor,
            telefone: telefone,
            combustivel: combustivel,
            observacoes: observacoes,
            ...checklistData, // Spread checklist items
            avarias_json: avariasJson,
            assinatura_cliente_url: assinaturaClienteUrl,
            assinatura_vistoriador_url: assinaturaVistoriadorUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return response.status(200).json({ success: true, data: newVistoria });
    }

    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função vistorias:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}
