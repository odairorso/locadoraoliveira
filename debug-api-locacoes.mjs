async function debugAPILocacoes() {
  console.log('🔍 Debugando API de locações...\n');

  try {
    const response = await fetch('http://localhost:5174/api/locacoes');
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API respondeu com sucesso');
    console.log('📊 Tipo de dados retornados:', typeof data);
    console.log('📊 É array?', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log(`📊 Total de locações: ${data.length}`);
      
      // Verificar as primeiras locações
      data.slice(0, 3).forEach((locacao, index) => {
        console.log(`\n${index + 1}. Locação #${locacao.id}:`);
        console.log(`   Cliente: ${locacao.cliente?.nome || 'N/A'}`);
        console.log(`   Veículo: ${locacao.veiculo?.modelo || 'N/A'}`);
        console.log(`   Valor Seguro: R$ ${locacao.valor_seguro || 0}`);
        console.log(`   Tipo valor_seguro: ${typeof locacao.valor_seguro}`);
        console.log(`   Status: ${locacao.status}`);
      });

      // Procurar especificamente a locação #31
      const locacao31 = data.find(l => l.id === 31);
      if (locacao31) {
        console.log('\n🎯 Locação #31 (a que estamos testando):');
        console.log(JSON.stringify(locacao31, null, 2));
      } else {
        console.log('\n❌ Locação #31 não encontrada na API');
      }

    } else {
      console.log('❌ API não retornou um array');
      console.log('Dados retornados:', data);
    }

  } catch (error) {
    console.error('❌ Erro ao acessar API:', error.message);
  }
}

debugAPILocacoes();