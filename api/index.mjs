import { createClient } from '@supabase/supabase-js';

// Import all handlers
import clientesHandler from '../src/api-handlers/clientes.mjs';
import veiculosHandler from '../src/api-handlers/veiculos.mjs';
import locacoesHandler from '../src/api-handlers/locacoes.mjs';
import manutencoesHandler from '../src/api-handlers/manutencoes.mjs';
import vistoriasHandler from '../src/api-handlers/vistorias.mjs';
import movimentacoesHandler from '../src/api-handlers/movimentacoes.mjs';
import dashboardHandler from '../src/api-handlers/dashboard.mjs';
import relatoriosHandler from '../src/api-handlers/relatorios.mjs';
import receitaPorVeiculoHandler from '../src/api-handlers/receita-por-veiculo.mjs';
import locacoesIdHandler from '../src/api-handlers/locacoes-id.mjs';
import manutencoesIdHandler from '../src/api-handlers/manutencoes-id.mjs';
import vistoriasIdHandler from '../src/api-handlers/vistorias-id.mjs';

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    // Extract the endpoint from the URL path
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Remove 'api' from path if present
    if (pathSegments[0] === 'api') {
      pathSegments.shift();
    }

    const endpoint = pathSegments[0];
    const id = pathSegments[1];

    // Add ID to query if present in path
    if (id && !request.query.id) {
      request.query.id = id;
    }

    // Route to appropriate handler
    switch (endpoint) {
      case 'clientes':
        return await clientesHandler(request, response);
      
      case 'veiculos':
        return await veiculosHandler(request, response);
      
      case 'locacoes':
        // Check if this is an ID-specific operation that needs special handling
        if (id && (request.method === 'PUT' || request.method === 'DELETE')) {
          return await locacoesIdHandler(request, response);
        }
        // For GET requests with ID, handle in main locacoes handler
        if (request.method === 'GET' && id) {
          request.query.id = id;
        }
        return await locacoesHandler(request, response);
      
      case 'manutencoes':
        // Check if this is an ID-specific operation that needs special handling
        if (id && (request.method === 'PUT' || request.method === 'DELETE')) {
          return await manutencoesIdHandler(request, response);
        }
        return await manutencoesHandler(request, response);
      
      case 'vistorias':
        // Check if this is an ID-specific operation that needs special handling
        if (id && (request.method === 'GET' || request.method === 'PUT' || request.method === 'DELETE')) {
          return await vistoriasIdHandler(request, response);
        }
        return await vistoriasHandler(request, response);
      
      case 'movimentacoes':
        return await movimentacoesHandler(request, response);
      
      case 'dashboard':
        return await dashboardHandler(request, response);
      
      case 'relatorios':
        return await relatoriosHandler(request, response);
      
      case 'receita-por-veiculo':
        return await receitaPorVeiculoHandler(request, response);
      
      default:
        return response.status(404).json({
          success: false,
          error: `Endpoint '${endpoint}' not found`,
          availableEndpoints: [
            'clientes', 'veiculos', 'locacoes', 'manutencoes', 
            'vistorias', 'movimentacoes', 'dashboard', 
            'relatorios', 'receita-por-veiculo'
          ]
        });
    }
  } catch (error) {
    console.error('Consolidated API Router Error:', error);
    return response.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}