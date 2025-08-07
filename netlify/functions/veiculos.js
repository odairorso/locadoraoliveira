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
      
      // Check if placa or renavam already exists
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
        error: "Erro interno do servidor"
      })
    };
  }
};
