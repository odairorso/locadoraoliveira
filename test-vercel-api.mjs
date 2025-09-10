// Script para testar as APIs localmente antes do deploy no Vercel
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testApi(endpoint) {
  try {
    console.log(`Testando ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    console.log(`✅ ${endpoint} - Status: ${response.status}`);
    return { success: true, status: response.status, endpoint };
  } catch (error) {
    console.error(`❌ ${endpoint} - Erro: ${error.message}`);
    return { success: false, error: error.message, endpoint };
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes das APIs...');
  
  const endpoints = [
    '/api/dashboard',
    '/api/clientes',
    '/api/veiculos',
    '/api/locacoes',
    '/api/movimentacoes',
    '/api/receita-por-veiculo'
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testApi(endpoint);
    results.push(result);
  }

  console.log('\n📊 Resumo dos testes:');
  const successful = results.filter(r => r.success).length;
  console.log(`✅ ${successful}/${results.length} APIs funcionando corretamente`);
  
  if (successful < results.length) {
    console.log('\n❌ APIs com problemas:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.endpoint}: ${r.error}`);
    });
  }
}

runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
});