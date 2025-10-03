async function testarAPICorrigida() {
  console.log('🔍 Testando API corrigida...\n');

  try {
    // Testar lista geral
    console.log('1. Testando lista geral de locações...');
    const response = await fetch('http://localhost:5174/api/locacoes');
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API retornou erro:', result.error);
      return;
    }

    const data = result.data;
    console.log('✅ API respondeu com sucesso');
    console.log(`📊 Total de locações: ${data.length}`);
    
    // Procurar locação #31
    const locacao31 = data.find(l => l.id === 31);
    if (locacao31) {
      console.log('\n🎯 Locação #31 encontrada:');
      console.log(`   ID: ${locacao31.id}`);
      console.log(`   Cliente: ${locacao31.cliente_nome}`);
      console.log(`   Valor Seguro: R$ ${locacao31.valor_seguro}`);
      console.log(`   Valor Total: R$ ${locacao31.valor_total}`);
      console.log(`   Status: ${locacao31.status}`);
      
      if (locacao31.valor_seguro > 0) {
        console.log('✅ SUCESSO: valor_seguro está sendo retornado pela API!');
      } else {
        console.log('❌ PROBLEMA: valor_seguro ainda está zerado');
      }
    } else {
      console.log('\n❌ Locação #31 não encontrada');
    }

    // Procurar locação #27 também
    const locacao27 = data.find(l => l.id === 27);
    if (locacao27) {
      console.log('\n🎯 Locação #27 encontrada:');
      console.log(`   ID: ${locacao27.id}`);
      console.log(`   Cliente: ${locacao27.cliente_nome}`);
      console.log(`   Valor Seguro: R$ ${locacao27.valor_seguro}`);
      console.log(`   Valor Total: R$ ${locacao27.valor_total}`);
      console.log(`   Status: ${locacao27.status}`);
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testarAPICorrigida();