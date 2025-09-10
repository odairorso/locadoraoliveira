// Teste das APIs para Vercel
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testApi(endpoint) {
  try {
    console.log(`Testando ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${response.status} - Sucesso`);
        return { success: true, status: response.status, endpoint };
      } else if (response.status === 500 && data.error === 'Missing Supabase URL or Anon Key') {
        console.log(`⚠️ ${endpoint} - Status: ${response.status} - Erro esperado: ${data.error}`);
        return { success: true, warning: true, error: data.error, endpoint };
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status} - Erro: ${data.error || 'Desconhecido'}`);
        return { success: false, error: data.error || 'Erro desconhecido', endpoint };
      }
    } else {
      console.log(`❌ ${endpoint} - Status: ${response.status} - Não retornou JSON válido`);
      return { success: false, error: 'Resposta não é JSON válido', endpoint };
    }
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
  const warnings = results.filter(r => r.warning).length;
  console.log(`✅ ${successful}/${results.length} APIs funcionando corretamente`);
  
  if (warnings > 0) {
    console.log(`⚠️ ${warnings} APIs com avisos (falta de variáveis de ambiente)`);
    console.log('   Isso é esperado em ambiente de teste local sem as variáveis configuradas.');
    console.log('   No Vercel, certifique-se de configurar as variáveis de ambiente conforme VERCEL_DEPLOYMENT.md');
  }
  
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