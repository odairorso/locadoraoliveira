import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);
    const id = pathSegments[pathSegments.length - 1];

    switch (method) {
      case 'GET':
        if (id && id !== 'movimentacoes') {
          // Get specific movimentacao
          const { data, error } = await supabase
            .from('movimentacoes_financeiras')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Movimentação não encontrada',
                details: error.message
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data,
              error: null
            })
          };
        } else {
          // Get all movimentacoes
          const { data, error } = await supabase
            .from('movimentacoes_financeiras')
            .select('*')
            .order('data_movimentacao', { ascending: false });

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Erro ao buscar movimentações',
                details: error.message
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data || [],
              error: null
            })
          };
        }

      case 'POST':
        const newMovimentacao = JSON.parse(event.body);
        
        // Validate required fields
        if (!newMovimentacao.tipo || !newMovimentacao.categoria || !newMovimentacao.descricao || 
            !newMovimentacao.valor || !newMovimentacao.data_movimentacao) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Campos obrigatórios: tipo, categoria, descricao, valor, data_movimentacao'
            })
          };
        }

        const { data: createdMovimentacao, error: createError } = await supabase
          .from('movimentacoes_financeiras')
          .insert([newMovimentacao])
          .select()
          .single();

        if (createError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Erro ao criar movimentação',
              details: createError.message
            })
          };
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: createdMovimentacao,
            error: null
          })
        };

      case 'PUT':
        if (!id || id === 'movimentacoes') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'ID da movimentação é obrigatório para atualização'
            })
          };
        }

        const updatedMovimentacao = JSON.parse(event.body);
        
        const { data: updated, error: updateError } = await supabase
          .from('movimentacoes_financeiras')
          .update(updatedMovimentacao)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Erro ao atualizar movimentação',
              details: updateError.message
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: updated,
            error: null
          })
        };

      case 'DELETE':
        if (!id || id === 'movimentacoes') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'ID da movimentação é obrigatório para exclusão'
            })
          };
        }

        const { error: deleteError } = await supabase
          .from('movimentacoes_financeiras')
          .delete()
          .eq('id', id);

        if (deleteError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Erro ao excluir movimentação',
              details: deleteError.message
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: { message: 'Movimentação excluída com sucesso' },
            error: null
          })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Método não permitido'
          })
        };
    }
  } catch (error) {
    console.error('Erro na função movimentacoes:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      })
    };
  }
};