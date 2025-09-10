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
    const { search, status } = request.query;
    
    const id = request.query.id; // Try to get ID from query parameters
    console.log("Backend received request.params:", request.params);
    console.log("Backend received request.query:", request.query);
    console.log("Backend extracted ID from query:", id);
    
    console.log('URL:', request.url, 'Método:', method, 'ID extraído:', id);

    if (method === 'GET') {
      let query = supabase.from('veiculos').select('*');
      if (search) {
        query = query.or(`modelo.ilike.%${search}%,marca.ilike.%${search}%,placa.ilike.%${search}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('marca', { ascending: true }).order('modelo', { ascending: true });
      if (error) throw error;
      return response.status(200).json({ success: true, data });
    }

    if (method === 'POST') {
      const { placa, renavam } = request.body;
      const { data: existing, error: existingError } = await supabase.from('veiculos').select('id').or(`placa.eq.${placa},renavam.eq.${renavam}`).single();
      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existing) {
        return response.status(400).json({ success: false, error: "Placa ou Renavam já cadastrados" });
      }
      const { data: newVeiculo, error } = await supabase.from('veiculos').insert([request.body]).select().single();
      if (error) throw error;
      return response.status(200).json({ success: true, data: newVeiculo });
    }

    if (method === 'PUT') {
      console.log('Recebida requisição PUT para veículos');
      console.log('Corpo da requisição:', JSON.stringify(request.body));
      console.log('URL completa:', request.url);
      console.log('ID da URL ou query:', id);
      
      // Obter ID do corpo da requisição se não estiver na URL
      const vehicleId = id || request.body.id;
      
      console.log('ID final para atualização:', vehicleId);
      
      if (!vehicleId) {
        console.error('ID não fornecido para atualização');
        return response.status(400).json({ success: false, error: 'ID do veículo não fornecido' });
      }
      
      console.log('Atualizando veículo ID:', vehicleId);
      console.log('Dados recebidos:', JSON.stringify(request.body));
      
      // Verificar se o veículo existe antes de atualizar
      const { data: existingVehicle, error: checkError } = await supabase
        .from('veiculos')
        .select('id')
        .eq('id', vehicleId)
        .single();
        
      if (checkError) {
        console.error('Erro ao verificar veículo:', checkError);
        return response.status(404).json({ success: false, error: 'Veículo não encontrado' });
      }
      
      console.log('Veículo encontrado, prosseguindo com atualização');
      
      // Remover o ID do corpo da requisição para evitar conflitos
      const updateData = { ...request.body };
      delete updateData.id;
      
      console.log('Dados para atualização:', JSON.stringify(updateData));
      
      const { data: updatedVeiculo, error } = await supabase
        .from('veiculos')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao atualizar veículo:', error);
        return response.status(500).json({ success: false, error: 'Erro ao atualizar veículo', details: error.message });
      }
      
      console.log('Veículo atualizado com sucesso:', updatedVeiculo);
      return response.status(200).json({ success: true, data: updatedVeiculo });
    }

    if (method === 'DELETE') {
      if (!id) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { data: activeRentals, error: rentalError } = await supabase.from('locacoes').select('id').eq('veiculo_id', id).eq('status', 'ativa');
      if (rentalError) throw rentalError;
      if (activeRentals && activeRentals.length > 0) {
        return response.status(400).json({ success: false, error: "Não é possível excluir um veículo que está sendo usado em locações ativas" });
      }
      const { error } = await supabase.from('veiculos').delete().eq('id', id);
      if (error) throw error;
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função veículos:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}
