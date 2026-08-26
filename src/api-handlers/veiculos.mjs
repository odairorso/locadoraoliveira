import { createClient } from '@supabase/supabase-js';

// Campos permitidos em criação/edição de veículos (evita mass assignment)
const ALLOWED_FIELDS = [
  'marca',
  'modelo',
  'ano',
  'placa',
  'renavam',
  'cor',
  'foto_principal',
  'tipo_operacao',
  'status',
  'valor_diaria',
  'valor_veiculo',
];

function whitelist(payload) {
  const clean = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (payload && payload[field] !== undefined) {
      clean[field] = payload[field];
    }
  });
  return clean;
}

// Sanitiza entrada usada em filtros PostgREST (.or/ilike): apenas letras, números e espaços
function sanitizeTerm(value) {
  return String(value || '').replace(/[^a-zA-Z0-9À-ÿ\s.-]/g, '');
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;
    const { search, status } = request.query;

    const id = request.query.id;

    if (method === 'GET') {
      // Não expor renavam (documento do veículo) na listagem pública
      let query = supabase.from('veiculos').select('id, marca, modelo, ano, placa, cor, valor_diaria, valor_veiculo, tipo_operacao, status, foto_principal, fotos, quilometragem_atual, observacoes');
      if (search) {
        const term = sanitizeTerm(search);
        query = query.or(`modelo.ilike.%${term}%,marca.ilike.%${term}%,placa.ilike.%${term}%`);
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
      const placaClean = sanitizeTerm(placa);
      const renavamClean = sanitizeTerm(renavam);
      const { data: existing, error: existingError } = await supabase.from('veiculos').select('id').or(`placa.eq.${placaClean},renavam.eq.${renavamClean}`).single();
      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existing) {
        return response.status(400).json({ success: false, error: 'Placa ou Renavam já cadastrados' });
      }
      const { data: newVeiculo, error } = await supabase.from('veiculos').insert([whitelist(request.body)]).select().single();
      if (error) throw error;
      return response.status(201).json({ success: true, data: newVeiculo });
    }

    if (method === 'PUT') {
      const urlObj = new URL(request.url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const lastPathPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
      const vehicleId = id || request.body?.id || lastPathPart;

      if (!vehicleId) {
        return response.status(400).json({ success: false, error: 'ID do veículo não fornecido' });
      }

      const { data: existingVehicle, error: checkError } = await supabase
        .from('veiculos')
        .select('id')
        .eq('id', vehicleId)
        .single();

      if (checkError) {
        return response.status(404).json({ success: false, error: 'Veículo não encontrado' });
      }

      const updateData = whitelist(request.body);

      const { data: updatedVeiculo, error } = await supabase
        .from('veiculos')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        return response.status(500).json({ success: false, error: 'Erro ao atualizar veículo' });
      }

      return response.status(200).json({ success: true, data: updatedVeiculo });
    }

    if (method === 'DELETE') {
      const urlObj = new URL(request.url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const lastPathPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
      const deleteId = id || lastPathPart;
      const finalDeleteId = deleteId && /^\d+$/.test(deleteId) ? deleteId : null;

      if (!finalDeleteId) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { data: activeRentals, error: rentalError } = await supabase.from('locacoes').select('id').eq('veiculo_id', finalDeleteId).eq('status', 'ativa');
      if (rentalError) throw rentalError;
      if (activeRentals && activeRentals.length > 0) {
        return response.status(400).json({ success: false, error: 'Não é possível excluir um veículo que está sendo usado em locações ativas' });
      }
      const { error } = await supabase.from('veiculos').delete().eq('id', finalDeleteId);
      if (error) throw error;
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Erro na função veículos:', error);
    return response.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
}
