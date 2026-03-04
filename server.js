import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import compression from 'compression';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(__dirname, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Arquivos com hash no nome (ex: index-abc123.js) podem ser cacheados por mais tempo
    if (/[.-][a-f0-9]{6,}\./i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Rota para a página principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Função para carregar o roteador consolidado da API
const loadApiRoutes = async () => {
  try {
    // Importar o roteador consolidado
    const apiRouter = await import(`file://${join(__dirname, 'api', 'index.mjs')}`);
    
    if (apiRouter.default) {
      // Configurar rota catch-all para todas as requisições da API (Express v5 compatível)
      app.all(/^\/api\/.+$/, async (req, res) => {
        console.log(`API Request: ${req.method} ${req.url}`);
        console.log(`Looking for API file: ${join(__dirname, 'api', 'index.mjs')}`);
        console.log('Found API file, importing...');
        console.log('Executing API handler...');
        
        try {
          await apiRouter.default(req, res);
        } catch (error) {
          console.error('Erro no roteador consolidado da API:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor', 
            details: error.message 
          });
        }
      });
      
      console.log('✓ Roteador consolidado da API carregado');
    } else {
      throw new Error('Roteador consolidado não encontrado');
    }
  } catch (error) {
    console.error('Erro ao carregar roteador consolidado:', error);
    throw error;
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
    console.log('   - /api/vistorias');
    console.log('   - /api/relatorios?tipo=financeiro');
    console.log('   - /api/relatorios?tipo=veiculos');
    console.log('   - /api/relatorios?tipo=clientes');
    console.log('   - /api/relatorios?tipo=locacoes');
  });
}).catch(error => {
  console.error('Erro ao inicializar servidor:', error);
});
