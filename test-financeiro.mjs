import fetch from 'node-fetch';

async function testFinanceiroAPI() {
  console.log('=== Testando API Financeiro ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/relatorios/financeiro?inicio=2025-08-01&fim=2025-10-31');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testFinanceiroAPI();