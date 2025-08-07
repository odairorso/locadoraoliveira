import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
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
      
      let query = supabase.from('veiculos').select('*');
      
      if (search) {
        query = query.or(`modelo.ilike.%${search}%,marca.ilike.%${search}%,placa.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('marca', { ascending: true }).order('modelo', { ascending: true });

      if (error) throw error;
      
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
          data: data,
          error: null
        })
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      
      const { data: existing, error: existingError } = await supabase
        .from('veiculos')
        .select('id')
        .or(`placa.eq.${data.placa},renavam.eq.${data.renavam}`)
        .single();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existing) {
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
            error: "Placa ou Renavam já cadastrados"
          })
        };
      }
      
      const { data: newVeiculo, error } = await supabase
        .from('veiculos')
        .insert([
          {
            modelo: data.modelo,
            marca: data.marca,
            ano: data.ano,
            placa: data.placa,
            renavam: data.renavam,
            cor: data.cor,
            valor_diaria: data.valor_diaria || null,
            valor_veiculo: data.valor_veiculo,
            tipo_operacao: data.tipo_operacao,
            status: data.status || 'disponivel'
          }
        ])
        .select()
        .single();

      if (error) throw error;

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
          data: newVeiculo,
          error: null
        })
      };
    }

    if (method === 'PUT') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      const data = JSON.parse(event.body);
      
      const { data: updatedVeiculo, error } = await supabase
        .from('veiculos')
        .update({
          modelo: data.modelo,
          marca: data.marca,
          ano: data.ano,
          placa: data.placa,
          renavam: data.renavam,
          cor: data.cor,
          valor_diaria: data.valor_diaria || null,
          valor_veiculo: data.valor_veiculo,
          tipo_operacao: data.tipo_operacao,
          status: data.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
          data: updatedVeiculo,
          error: null
        })
      };
    }

    if (method === 'DELETE') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
    console.error("Erro na função veículos:", error);
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
