import fetch from 'node-fetch';

async function testLocalAPI() {
  try {
    console.log('🔍 Testando API local de vistorias...');
    
    const response = await fetch('http://localhost:5174/api/vistorias');
    const result = await response.json();
    
    console.log('📊 Resultado da API:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data && result.data.vistorias) {
      const vistorias = result.data.vistorias;
      console.log(`📊 Total de vistorias: ${vistorias.length}`);
      
      const entradas = vistorias.filter(v => v.tipo_vistoria === 'entrada');
      const saidas = vistorias.filter(v => v.tipo_vistoria === 'saida');
      
      console.log(`🟢 Vistorias de entrada: ${entradas.length}`);
      console.log(`🔴 Vistorias de saída: ${saidas.length}`);
      
      if (entradas.length > 0) {
        console.log('\n📝 Primeira vistoria de entrada:');
        console.log(JSON.stringify(entradas[0], null, 2));
      }
      
      if (saidas.length > 0) {
        console.log('\n📝 Primeira vistoria de saída:');
        console.log(JSON.stringify(saidas[0], null, 2));
      }
      
      // Verificar se há vistorias de entrada para veículos específicos
      console.log('\n🔍 Verificando vistorias por veículo...');
      const veiculosComEntrada = [...new Set(entradas.map(v => v.veiculo_id))];
      console.log(`🚗 Veículos com vistoria de entrada: ${veiculosComEntrada.join(', ')}`);
      
    } else {
      console.log('⚠️ Nenhuma vistoria encontrada!');
    }
    
    // Testar API de locações
    console.log('\n🚗 Testando API de locações...');
    const locacoesResponse = await fetch('http://localhost:5174/api/locacoes?status=ativa');
    const locacoesResult = await locacoesResponse.json();
    
    if (locacoesResult.success && locacoesResult.data) {
      console.log(`📊 Locações ativas: ${locacoesResult.data.length}`);
      if (locacoesResult.data.length > 0) {
        console.log('Primeira locação ativa:', JSON.stringify(locacoesResult.data[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testLocalAPI();