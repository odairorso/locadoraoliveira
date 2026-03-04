import { createClient } from '@supabase/supabase-js';

async function detectColumns(supabase) {
  let docColumn = 'cpf_cnpj';
  let hasTipoPessoa = true;

  const checkColumn = async (col) => {
    const { error } = await supabase.from('clientes').select(col).limit(1);
    return !error;
  };

  if (!(await checkColumn('cpf_cnpj'))) {
    if (await checkColumn('cpf')) {
      docColumn = 'cpf';
    }
  }

  hasTipoPessoa = await checkColumn('tipo_pessoa');

  return { docColumn, hasTipoPessoa };
}

function normalizePayloadForSchema(body, { docColumn, hasTipoPessoa }) {
  const payload = { ...body };

  if (docColumn === 'cpf') {
    payload.cpf = payload.cpf_cnpj;
    delete payload.cpf_cnpj;
  }

  if (!hasTipoPessoa) {
    delete payload.tipo_pessoa;
  }

  return payload;
}

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    const { search, id, limit } = request.query;

    const schema = await detectColumns(supabase);

    if (method === 'GET') {
      let query = supabase.from('clientes').select('*');
      if (search) {
        const docCol = schema.docColumn;
        query = query.or(`nome.ilike.%${search}%,${docCol}.ilike.%${search}%`);
      }
      if (limit && /^\d+$/.test(String(limit))) {
        query = query.limit(parseInt(limit));
      }
      const { data, error } = await query.order('nome', { ascending: true });
      if (error) throw error;
      return response.status(200).json({ success: true, data });
    }

    if (method === 'POST') {
      const { cpf_cnpj } = request.body;

      let existing = null;
      let existingError = null;
      if (schema.docColumn === 'cpf_cnpj') {
        ({ data: existing, error: existingError } = await supabase
          .from('clientes')
          .select('id')
          .eq('cpf_cnpj', cpf_cnpj)
          .single());
      } else {
        ({ data: existing, error: existingError } = await supabase
          .from('clientes')
          .select('id')
          .eq('cpf', cpf_cnpj)
          .single());
      }

      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existing) {
        return response.status(400).json({ success: false, error: "CPF/CNPJ já cadastrado" });
      }

      const payload = normalizePayloadForSchema(request.body, schema);

      const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return response.status(200).json({ success: true, data: newCliente });
    }

    if (method === 'PUT') {
      const urlObj = new URL(request.url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const lastPathPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
      const updateId = id || lastPathPart;
      const finalUpdateId = updateId && /^\d+$/.test(updateId) ? updateId : null;

      if (!finalUpdateId) return response.status(400).json({ success: false, error: 'Missing ID' });

      // Verificar se o nome está presente no body
      if (!request.body.nome || request.body.nome.trim() === '') {
        return response.status(400).json({ success: false, error: 'Nome é obrigatório' });
      }

      const payload = normalizePayloadForSchema(request.body, schema);

      const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', finalUpdateId)
        .select()
        .single();

      if (error) throw error;
      return response.status(200).json({ success: true, data: updatedCliente });
    }

    if (method === 'DELETE') {
      const urlObj = new URL(request.url, 'http://localhost');
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const lastPathPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
      const deleteId = id || lastPathPart;
      const finalDeleteId = deleteId && /^\d+$/.test(deleteId) ? deleteId : null;

      if (!finalDeleteId) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { error } = await supabase.from('clientes').delete().eq('id', finalDeleteId);
      if (error) throw error;
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função clientes:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}
