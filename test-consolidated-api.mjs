import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5174';

async function testAPI() {
  console.log('🧪 Testando API consolidada...\n');

  const tests = [
    {
      name: 'Dashboard',
      url: `${BASE_URL}/api/dashboard`,
      method: 'GET'
    },
    {
      name: 'Clientes',
      url: `${BASE_URL}/api/clientes`,
      method: 'GET'
    },
    {
      name: 'Veículos',
      url: `${BASE_URL}/api/veiculos`,
      method: 'GET'
    },
    {
      name: 'Locações',
      url: `${BASE_URL}/api/locacoes`,
      method: 'GET'
    },
    {
      name: 'Locação específica (ID 31)',
      url: `${BASE_URL}/api/locacoes/31`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📡 Testando ${test.name}...`);
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${test.name}: OK (${response.status})`);
        if (test.name === 'Dashboard') {
          console.log(`   📊 Receita seguros: R$${data.data?.receita_seguros || 'N/A'}`);
        }
        if (test.name === 'Locação específica (ID 31)') {
          console.log(`   💰 Valor seguro: R$${data.data?.valor_seguro || 'N/A'}`);
        }
      } else {
        console.log(`❌ ${test.name}: ERRO (${response.status})`);
        console.log(`   Erro: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.log(`💥 ${test.name}: FALHA NA CONEXÃO`);
      console.log(`   Erro: ${error.message}`);
    }
    console.log('');
  }
}

testAPI().catch(console.error);