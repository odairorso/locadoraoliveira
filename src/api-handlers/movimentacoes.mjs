import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Campos permitidos em criação/edição (evita mass assignment: o cliente não
// pode forjar id, created_at, locacao_id/cliente_id de terceiros etc.)
const ALLOWED_FIELDS = [
  'tipo',
  'categoria',
  'descricao',
  'valor',
  'data_movimentacao',
  'locacao_id',
  'cliente_id',
  'observacoes',
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

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const { method } = request;
    const { id } = request.query;

    switch (method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase.from('movimentacoes_financeiras').select('*').eq('id', id).single();
          if (error) return response.status(404).json({ success: false, error: 'Movimentação não encontrada' });
          return response.status(200).json({ success: true, data });
        } else {
          const { data, error } = await supabase.from('movimentacoes_financeiras').select('*').order('data_movimentacao', { ascending: false });
          if (error) return response.status(500).json({ success: false, error: 'Erro ao buscar movimentações' });
          return response.status(200).json({ success: true, data: data || [] });
        }

      case 'POST': {
        const newMovimentacao = whitelist(request.body);
        if (!newMovimentacao.tipo || !newMovimentacao.categoria || !newMovimentacao.descricao || newMovimentacao.valor === undefined || !newMovimentacao.data_movimentacao) {
          return response.status(400).json({ success: false, error: 'Campos obrigatórios: tipo, categoria, descricao, valor, data_movimentacao' });
        }
        if (!['entrada', 'saida'].includes(newMovimentacao.tipo)) {
          return response.status(400).json({ success: false, error: 'tipo deve ser "entrada" ou "saida"' });
        }
        const valor = Number(newMovimentacao.valor);
        if (Number.isNaN(valor) || valor < 0) {
          return response.status(400).json({ success: false, error: 'valor deve ser um número maior ou igual a zero' });
        }
        newMovimentacao.valor = valor;

        const { data: createdMovimentacao, error: createError } = await supabase.from('movimentacoes_financeiras').insert([newMovimentacao]).select().single();
        if (createError) return response.status(500).json({ success: false, error: 'Erro ao criar movimentação' });
        return response.status(201).json({ success: true, data: createdMovimentacao });
      }

      case 'PUT': {
        if (!id) return response.status(400).json({ success: false, error: 'ID da movimentação é obrigatório para atualização' });
        const updateData = whitelist(request.body);
        const { data: updated, error: updateError } = await supabase.from('movimentacoes_financeiras').update(updateData).eq('id', id).select().single();
        if (updateError) return response.status(500).json({ success: false, error: 'Erro ao atualizar movimentação' });
        return response.status(200).json({ success: true, data: updated });
      }

      case 'DELETE':
        if (!id) return response.status(400).json({ success: false, error: 'ID da movimentação é obrigatório para exclusão' });
        {
          const { error: deleteError } = await supabase.from('movimentacoes_financeiras').delete().eq('id', id);
          if (deleteError) return response.status(500).json({ success: false, error: 'Erro ao excluir movimentação' });
          return response.status(200).json({ success: true, data: { message: 'Movimentação excluída com sucesso' } });
        }

      default:
        response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erro na função movimentacoes:', error);
    return response.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
