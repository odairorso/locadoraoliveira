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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;

    if (method === 'GET') {
      // Buscar todas as locações finalizadas
      const { data: locacoes, error: locacoesError } = await supabase
        .from('locacoes')
        .select('*, veiculos(id, marca, modelo, placa)')
        .eq('status', 'finalizada');

      if (locacoesError) throw locacoesError;

      // Agrupar por veículo e calcular receita
      const receitaPorVeiculo = {};
      
      locacoes.forEach(locacao => {
        const veiculoId = locacao.veiculo_id;
        const veiculo = locacao.veiculos;
        
        if (!receitaPorVeiculo[veiculoId]) {
          receitaPorVeiculo[veiculoId] = {
            id: veiculoId,
            marca: veiculo.marca,
            modelo: veiculo.modelo,
            placa: veiculo.placa,
            total_locacoes: 0,
            receita_total: 0
          };
        }
        
        receitaPorVeiculo[veiculoId].total_locacoes += 1;
        receitaPorVeiculo[veiculoId].receita_total += parseFloat(locacao.valor_total || 0);
      });

      const resultado = Object.values(receitaPorVeiculo).sort((a, b) => b.receita_total - a.receita_total);
      
      return response.status(200).json({ success: true, data: resultado });
    }

    response.setHeader('Allow', ['GET']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função receita-por-veiculo:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}