import fetch from 'node-fetch';

async function testContractEndpoint() {
  try {
    console.log('🔍 Testando endpoint de contrato...');
    
    // Primeiro, vamos buscar uma locação específica
    const locacoesResponse = await fetch('http://localhost:3000/api/locacoes');
    const locacoesData = await locacoesResponse.json();
    
    console.log('📋 Status da resposta de locações:', locacoesResponse.status);
    console.log('📋 Dados de locações:', JSON.stringify(locacoesData, null, 2));
    
    if (locacoesData.success && locacoesData.data && locacoesData.data.length > 0) {
      const primeiraLocacao = locacoesData.data[0];
      console.log('🎯 Testando contrato para locação ID:', primeiraLocacao.id);
      
      // Testar endpoint de dados do contrato
      const contratoResponse = await fetch(`http://localhost:3000/api/locacoes/${primeiraLocacao.id}/contrato-data`);
      const contratoData = await contratoResponse.json();
      
      console.log('📄 Status da resposta do contrato:', contratoResponse.status);
      console.log('📄 Headers da resposta:', Object.fromEntries(contratoResponse.headers.entries()));
      console.log('📄 Dados do contrato:', JSON.stringify(contratoData, null, 2));
      
      // Verificar se a estrutura está correta
      if (contratoData.success) {
        console.log('✅ Contrato carregado com sucesso!');
        console.log('📊 Estrutura dos dados:');
        console.log('  - Cliente:', contratoData.data?.cliente_nome || 'NÃO ENCONTRADO');
        console.log('  - Veículo:', contratoData.data?.veiculo_marca, contratoData.data?.veiculo_modelo || 'NÃO ENCONTRADO');
        console.log('  - Valor Total:', contratoData.data?.valor_total_formatted || 'NÃO ENCONTRADO');
        console.log('  - Data Locação:', contratoData.data?.data_locacao_formatted || 'NÃO ENCONTRADO');
      } else {
        console.log('❌ Erro no contrato:', contratoData.error);
      }
      
    } else {
      console.log('❌ Nenhuma locação encontrada para testar');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testContractEndpoint();