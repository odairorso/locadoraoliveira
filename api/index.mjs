import { createClient } from '@supabase/supabase-js';

// Import individual handlers
import clientesHandler from './handlers/clientes.mjs';
import veiculosHandler from './handlers/veiculos.mjs';
import locacoesHandler from './handlers/locacoes.mjs';
import manutencoesHandler from './handlers/manutencoes.mjs';
import vistoriasHandler from './handlers/vistorias.mjs';
import movimentacoesHandler from './handlers/movimentacoes.mjs';
import dashboardHandler from './handlers/dashboard.mjs';
import relatoriosHandler from './handlers/relatorios.mjs';
import receitaPorVeiculoHandler from './handlers/receita-por-veiculo.mjs';

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
        // For GET requests with ID, handle in main locacoes handler
        if (request.method === 'GET' && id) {
          request.query.id = id;
        }
        return await locacoesHandler(request, response);
      case 'manutencoes':
        return await manutencoesHandler(request, response);
      case 'vistorias':
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
    console.error('API Router Error:', error);
    return response.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}