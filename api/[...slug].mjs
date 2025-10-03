import { createClient } from '@supabase/supabase-js';

// Import individual ID handlers
import locacoesIdHandler from './handlers/locacoes-id.mjs';
import manutencoesIdHandler from './handlers/manutencoes-id.mjs';
import vistoriasIdHandler from './handlers/vistorias-id.mjs';

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
    // Extract the endpoint and ID from the URL path
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

    // Route to appropriate ID handler
    switch (endpoint) {
      case 'locacoes':
        if (id) {
          return await locacoesIdHandler(request, response);
        }
        break;
      case 'manutencoes':
        if (id) {
          return await manutencoesIdHandler(request, response);
        }
        break;
      case 'vistorias':
        if (id) {
          return await vistoriasIdHandler(request, response);
        }
        break;
      default:
        return response.status(404).json({
          success: false,
          error: `Endpoint '${endpoint}' with ID not found`,
          availableEndpoints: ['locacoes', 'manutencoes', 'vistorias']
        });
    }

    // If we get here, it means no ID was provided
    return response.status(400).json({
      success: false,
      error: 'ID is required for this endpoint'
    });

  } catch (error) {
    console.error('API ID Router Error:', error);
    return response.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}