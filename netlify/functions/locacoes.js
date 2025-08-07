import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
  try {
    const method = event.httpMethod;
    
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        }
      };
    }

    if (method === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const search = queryParams.search || '';
      const status = queryParams.status || '';
      
      let query = supabase.from('locacoes').select(`
        *,
        cliente:clientes ( nome ),
        veiculo:veiculos ( marca, modelo, placa )
      `);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(l => ({
        ...l,
        cliente_nome: l.cliente?.nome,
        veiculo_info: `${l.veiculo?.marca} ${l.veiculo?.modelo} - ${l.veiculo?.placa}`,
      }));
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        },
        body: JSON.stringify({
          success: true,
          data: formattedData,
          error: null
        })
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      
      const { data: veiculo, error: veiculoError } = await supabase
        .from('veiculos')
        .select('status')
        .eq('id', data.veiculo_id)
        .single();

      if (veiculoError) throw veiculoError;
      if (!veiculo || veiculo.status !== 'disponivel') {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
          },
          body: JSON.stringify({
            success: false,
            error: "Veículo não está disponível"
          })
        };
      }
      
      const { data: overlap, error: overlapError } = await supabase
        .from('locacoes')
        .select('id')
        .eq('veiculo_id', data.veiculo_id)
        .eq('status', 'ativa')
        .or(`data_locacao.lte.${data.data_entrega},data_entrega.gte.${data.data_locacao}`)
        .single();

      if (overlapError && overlapError.code !== 'PGRST116') throw overlapError;
      if (overlap) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
          },
          body: JSON.stringify({
            success: false,
            error: "Veículo já possui locação no período informado"
          })
        };
      }
      
      const { data: newLocacao, error } = await supabase
        .from('locacoes')
        .insert([
          {
            cliente_id: data.cliente_id,
            veiculo_id: data.veiculo_id,
            data_locacao: data.data_locacao,
            data_entrega: data.data_entrega,
            valor_diaria: data.valor_diaria,
            valor_total: data.valor_total,
            valor_caucao: data.valor_caucao || 0,
            status: data.status || 'ativa',
            observacoes: data.observacoes || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('veiculos')
        .update({ status: 'locado' })
        .eq('id', data.veiculo_id);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        },
        body: JSON.stringify({
          success: true,
          data: newLocacao,
          error: null
        })
      };
    }

    if (method === 'PUT') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      const data = JSON.parse(event.body);
      
      const { data: currentLocacao, error: currentError } = await supabase
        .from('locacoes')
        .select('veiculo_id')
        .eq('id', id)
        .single();

      if (currentError) throw currentError;

      const { data: updatedLocacao, error } = await supabase
        .from('locacoes')
        .update({
          cliente_id: data.cliente_id,
          veiculo_id: data.veiculo_id,
          data_locacao: data.data_locacao,
          data_entrega: data.data_entrega,
          valor_diaria: data.valor_diaria,
          valor_total: data.valor_total,
          valor_caucao: data.valor_caucao || 0,
          status: data.status,
          observacoes: data.observacoes || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data.status === 'finalizada' || data.status === 'cancelada') {
        await supabase
          .from('veiculos')
          .update({ status: 'disponivel' })
          .eq('id', currentLocacao.veiculo_id);
      }

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        },
        body: JSON.stringify({
          success: true,
          data: updatedLocacao,
          error: null
        })
      };
    }

    if (method === 'DELETE') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      
      const { data: locacao, error: locacaoError } = await supabase
        .from('locacoes')
        .select('veiculo_id')
        .eq('id', id)
        .single();

      if (locacaoError) throw locacaoError;

      await supabase
        .from('locacoes')
        .delete()
        .eq('id', id);

      await supabase
        .from('veiculos')
        .update({ status: 'disponivel' })
        .eq('id', locacao.veiculo_id);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        },
        body: JSON.stringify({
          success: true,
          data: null,
          error: null
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: "Method not allowed"
      })
    };

  } catch (error) {
    console.error("Erro na função locações:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: "Erro interno do servidor.",
        details: error.message
      })
    };
  }
};
