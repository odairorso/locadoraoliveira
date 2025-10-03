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
const apiPlugin = (): any => ({
  name: 'api-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
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
            req.on('data', (chunk: any) => {
              body += chunk.toString();
            });
            
            await new Promise<void>((resolve) => {
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
            // /api/dashboard -> api/index.mjs (consolidated main API)
            apiPath = path.join(process.cwd(), 'api', 'index.mjs');
          } else if (pathParts.length >= 2) {
            // For GET requests with ID, use main API (supports ID in query)
            // For PUT/POST/DELETE with ID, use slug API (ID-specific operations)
            if (req.method === 'GET') {
              apiPath = path.join(process.cwd(), 'api', 'index.mjs');
            } else {
              apiPath = path.join(process.cwd(), 'api', '[...slug].mjs');
            }
          }
          
          console.log('Looking for API file:', apiPath);
          
          if (apiPath && fs.existsSync(apiPath)) {
             console.log('Found API file, importing...');
             
             // Preparar req.params para a nova estrutura
             req.params = {};
             if (pathParts.length >= 2) {
               req.params.slug = pathParts;
             }
             
             res.status = function(code: number) {
               res.statusCode = code;
               return {
                 json: (data: any) => {
                   res.setHeader('Content-Type', 'application/json');
                   res.end(JSON.stringify(data));
                 },
                 end: (data: any) => {
                   if (data) res.write(data);
                   res.end();
                 },
                 send: (data: any) => {
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
          res.end(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }));
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
