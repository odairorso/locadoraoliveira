import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import dotenv from 'dotenv';
// import { cloudflare } from "@cloudflare/vite-plugin";
// import { mochaPlugins } from "@getmocha/vite-plugins";

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Plugin para servir APIs
const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) {
        return next();
      }
      
      console.log('API Request:', req.method, req.url);
      
      (async () => {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathParts = url.pathname.split('/').filter(p => p);
          
          // Remove 'api' do início
          pathParts.shift();
          
          // Processar query parameters
          req.query = {};
          url.searchParams.forEach((value, key) => {
            req.query[key] = value;
          });
          
          // Processar body para POST/PUT/PATCH
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            await new Promise((resolve) => {
              req.on('end', () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                } catch (e) {
                  req.body = {};
                }
                resolve();
              });
            });
          }
          
          let apiPath;
          if (pathParts.length === 1) {
            // /api/vistorias -> api/vistorias.mjs
            apiPath = path.join(process.cwd(), 'api', `${pathParts[0]}.mjs`);
          } else if (pathParts.length === 2) {
            // /api/vistorias/1 -> api/vistorias/[id].mjs
            apiPath = path.join(process.cwd(), 'api', pathParts[0], '[id].mjs');
          }
          
          console.log('Looking for API file:', apiPath);
          
          if (apiPath && fs.existsSync(apiPath)) {
             console.log('Found API file, importing...');
             
             // Preparar req.query para APIs que precisam do ID
             if (pathParts.length === 2) {
               req.query = { ...req.query, id: pathParts[1] };
             }
             
             // Wrapper para compatibilizar response.status() com Node.js
             const originalStatus = res.status;
             res.status = function(code) {
               res.statusCode = code;
               return {
                 json: (data) => {
                   res.setHeader('Content-Type', 'application/json');
                   res.end(JSON.stringify(data));
                 },
                 end: (data) => {
                   if (data) res.write(data);
                   res.end();
                 },
                 send: (data) => {
                   if (typeof data === 'object') {
                     res.setHeader('Content-Type', 'application/json');
                     res.end(JSON.stringify(data));
                   } else {
                     res.end(data);
                   }
                 }
               };
             };
             
             const module = await import(`file://${apiPath}?t=${Date.now()}`);
             if (module.default) {
               console.log('Executing API handler...');
               await module.default(req, res);
               return;
             }
           }
          
          console.log('API file not found or no default export');
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API endpoint not found' }));
        } catch (error) {
          console.error('API Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
        }
      })();
    });
  }
});

export default defineConfig(() => {
  return {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [/*...mochaPlugins(process.env as any),*/ react(), apiPlugin()/*, cloudflare()*/],
  server: {
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: '.',
  envPrefix: ['VITE_'],
  };
});
