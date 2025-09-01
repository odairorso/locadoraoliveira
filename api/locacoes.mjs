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

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;
    const { search, status } = request.query;
    const idMatch = request.url.match(/\/api\/locacoes\/([^\/]+)/);
    const id = idMatch ? idMatch[1] : request.query.id;

    if (method === 'GET') {
      if (request.url.includes('contrato-data')) {
        const { data: locacao, error: locacaoError } = await supabase
          .from('locacoes')
          .select(`*, cliente:clientes (*), veiculo:veiculos (*)`)
          .eq('id', id)
          .single();

        if (locacaoError) {
          return response.status(404).json({ success: false, error: "Locação não encontrada" });
        }

        const enderecoCompleto = `${locacao.cliente.endereco || ''}, ${locacao.cliente.numero || ''}, ${locacao.cliente.bairro || ''}, ${locacao.cliente.cidade || ''} - ${locacao.cliente.estado || ''}, CEP: ${locacao.cliente.cep || ''}`;
        const formatCurrency = (value) => value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value)) : 'R$ 0,00';
        const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '';

        const contractData = {
          id: locacao.id,
          cliente_nome: locacao.cliente.nome,
          cliente_cpf: locacao.cliente.cpf,
          endereco_completo: enderecoCompleto,
          veiculo_marca: locacao.veiculo.marca,
          veiculo_modelo: locacao.veiculo.modelo,
          veiculo_ano: locacao.veiculo.ano,
          veiculo_placa: locacao.veiculo.placa,
          valor_veiculo_formatted: formatCurrency(locacao.veiculo.valor_veiculo),
          valor_diaria_formatted: formatCurrency(locacao.valor_diaria),
          valor_total_formatted: formatCurrency(locacao.valor_total),
          valor_caucao_formatted: formatCurrency(locacao.valor_caucao),
          data_locacao_formatted: formatDate(locacao.data_locacao),
          data_entrega_formatted: formatDate(locacao.data_entrega),
          data_atual_formatted: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        };

        return response.status(200).json({ success: true, data: contractData });
      }

      let query = supabase.from('locacoes').select(`*, cliente:clientes ( nome ), veiculo:veiculos ( marca, modelo, placa )`);
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(l => ({ ...l, cliente_nome: l.cliente?.nome, veiculo_info: `${l.veiculo?.marca} ${l.veiculo?.modelo} - ${l.veiculo?.placa}` }));
      return response.status(200).json({ success: true, data: formattedData });
    }

    if (method === 'POST') {
      const { veiculo_id, data_locacao, data_entrega } = request.body;
      const { data: veiculo, error: veiculoError } = await supabase.from('veiculos').select('status').eq('id', veiculo_id).single();

      if (veiculoError) throw veiculoError;
      if (!veiculo || veiculo.status !== 'disponivel') {
        return response.status(400).json({ success: false, error: "Veículo não está disponível" });
      }

      const { data: overlap, error: overlapError } = await supabase.from('locacoes').select('id').eq('veiculo_id', veiculo_id).eq('status', 'ativa').or(`data_locacao.lte.${data_entrega},data_entrega.gte.${data_locacao}`).single();

      if (overlapError && overlapError.code !== 'PGRST116') throw overlapError;
      if (overlap) {
        return response.status(400).json({ success: false, error: "Veículo já possui locação no período informado" });
      }

      const { data: newLocacao, error } = await supabase.from('locacoes').insert([request.body]).select().single();
      if (error) throw error;

      await supabase.from('veiculos').update({ status: 'locado' }).eq('id', veiculo_id);
      return response.status(200).json({ success: true, data: newLocacao });
    }

    if (method === 'PUT') {
      if (!id) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { data: currentLocacao, error: currentError } = await supabase.from('locacoes').select('veiculo_id').eq('id', id).single();
      if (currentError) throw currentError;

      const { data: updatedLocacao, error } = await supabase.from('locacoes').update(request.body).eq('id', id).select().single();
      if (error) throw error;

      if (request.body.status === 'finalizada' || request.body.status === 'cancelada') {
        await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', currentLocacao.veiculo_id);
      }
      return response.status(200).json({ success: true, data: updatedLocacao });
    }

    if (method === 'DELETE') {
      if (!id) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { data: locacao, error: locacaoError } = await supabase.from('locacoes').select('veiculo_id').eq('id', id).single();
      if (locacaoError) throw locacaoError;

      await supabase.from('locacoes').delete().eq('id', id);
      await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locacao.veiculo_id);
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função locações:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}
