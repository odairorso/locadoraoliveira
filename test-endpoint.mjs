async function testEndpoint() {
  try {
    console.log('=== Testando endpoint contrato-data ===');
    
    const response = await fetch('http://localhost:3000/api/locacoes/7/contrato-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testEndpoint();