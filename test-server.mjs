import http from 'http';
import url from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  console.log(`${req.method} ${path}`);

  try {
    let modulePath;
    let query = parsedUrl.query;

    if (path === '/api/vistorias') {
      modulePath = './api/vistorias.mjs';
    } else if (path.startsWith('/api/vistorias/')) {
      modulePath = './api/vistorias/[id].mjs';
      const id = path.split('/api/vistorias/')[1];
      query.id = id;
      console.log(`Extracted ID: ${id}`);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'API não encontrada' }));
      return;
    }

    // Simular req e res do Express
    const mockReq = {
      method: req.method,
      query: query,
      body: null,
      url: req.url,
      path: path
    };

    // Para métodos com body, ler o corpo da requisição
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      await new Promise(resolve => {
        req.on('end', () => {
          try {
            mockReq.body = JSON.parse(body);
          } catch (e) {
            mockReq.body = {};
          }
          resolve();
        });
      });
    }

    const mockRes = {
      status: (code) => {
        res.statusCode = code;
        return mockRes;
      },
      json: (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      end: () => {
        res.end();
      }
    };

    const apiModule = await import(modulePath);
    const handler = apiModule.default;
    
    if (typeof handler === 'function') {
      await handler(mockReq, mockRes);
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Handler inválido' }));
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});