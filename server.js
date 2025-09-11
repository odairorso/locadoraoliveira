import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Função para carregar e executar arquivos .mjs da pasta api
const loadApiRoutes = async () => {
  const apiDir = join(__dirname, 'api');
  const files = fs.readdirSync(apiDir).filter(file => file.endsWith('.mjs'));
  
  for (const file of files) {
    try {
      const routeName = file.replace('.mjs', '');
      const modulePath = join(apiDir, file);
      const module = await import(`file://${modulePath}`);
      
      if (module.default) {
        // Configurar rotas para lidar com operações sem ID
        app.all(`/api/${routeName}`, async (req, res) => {
          console.log(`=== ${routeName.toUpperCase()} HANDLER ===`);
          console.log(`Method: ${req.method}`);
          console.log(`URL: ${req.url}`);
          console.log(`Params: ${JSON.stringify(req.params)}`);
          console.log(`========================`);
          
          try {
            await module.default(req, res);
          } catch (error) {
            console.error(`Erro na API ${routeName}:`, error);
            res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
          }
        });
        
        // Configurar rotas para lidar com operações com ID
        app.all(`/api/${routeName}/:id`, async (req, res) => {
          console.log(`=== ${routeName.toUpperCase()} HANDLER COM ID ===`);
          console.log(`Method: ${req.method}`);
          console.log(`URL: ${req.url}`);
          console.log(`Params: ${JSON.stringify(req.params)}`);
          console.log(`========================`);
          
          try {
            await module.default(req, res);
          } catch (error) {
            console.error(`Erro na API ${routeName} com ID:`, error);
            res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
          }
        });
        
        // Configurar rotas para contrato-data e contrato
        app.all(`/api/${routeName}/:id/contrato-data`, async (req, res) => {
          console.log(`=== ${routeName.toUpperCase()} CONTRATO-DATA ===`);
          console.log(`Method: ${req.method}`);
          console.log(`URL: ${req.url}`);
          console.log(`Params: ${JSON.stringify(req.params)}`);
          console.log(`========================`);
          
          try {
            await module.default(req, res);
          } catch (error) {
            console.error(`Erro na API ${routeName} contrato-data:`, error);
            res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
          }
        });
        
        app.all(`/api/${routeName}/:id/contrato`, async (req, res) => {
          console.log(`=== ${routeName.toUpperCase()} CONTRATO ===`);
          console.log(`Method: ${req.method}`);
          console.log(`URL: ${req.url}`);
          console.log(`Params: ${JSON.stringify(req.params)}`);
          console.log(`========================`);
          
          try {
            await module.default(req, res);
          } catch (error) {
            console.error(`Erro na API ${routeName} contrato:`, error);
            res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
          }
        });
        console.log(`✓ Rota carregada: /api/${routeName}`);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${file}:`, error);
    }
  }
};

// Carregar rotas da API
loadApiRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor API rodando em http://localhost:${PORT}`);
    console.log('📁 APIs disponíveis:');
    console.log('   - /api/dashboard');
    console.log('   - /api/clientes');
    console.log('   - /api/veiculos');
    console.log('   - /api/locacoes');
    console.log('   - /api/movimentacoes');
  });
}).catch(error => {
  console.error('Erro ao inicializar servidor:', error);
});