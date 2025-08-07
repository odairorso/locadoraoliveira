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
      
      let query = supabase.from('clientes').select('*');
      
      if (search) {
        query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('nome', { ascending: true });

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
        .from('clientes')
        .select('id')
        .eq('cpf', data.cpf)
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
            error: "CPF já cadastrado"
          })
        };
      }
      
      const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert([
          { 
            nome: data.nome, 
            cpf: data.cpf, 
            celular: data.celular, 
            endereco: data.endereco, 
            bairro: data.bairro || null, 
            cidade: data.cidade || null, 
            estado: data.estado || null, 
            cep: data.cep || null, 
            email: data.email 
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
          data: newCliente,
          error: null
        })
      };
    }

    if (method === 'PUT') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      const data = JSON.parse(event.body);
      
      const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update({
          nome: data.nome,
          cpf: data.cpf,
          celular: data.celular,
          endereco: data.endereco,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          cep: data.cep || null,
          email: data.email
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
          data: updatedCliente,
          error: null
        })
      };
    }

    if (method === 'DELETE') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];
      
      const { error } = await supabase
        .from('clientes')
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
    console.error("Erro na função clientes:", error);
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
