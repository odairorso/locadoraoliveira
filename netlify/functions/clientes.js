const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
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
      // Parse query parameters
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
      
      // Check if CPF already exists
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
        error: "Erro interno do servidor"
      })
    };
  }
};
