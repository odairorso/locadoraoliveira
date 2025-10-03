import fetch from 'node-fetch';

async function testarDashboard() {
  console.log('🔍 Testando dashboard atual...\n');

  try {
    const response = await fetch('http://localhost:5174/api/dashboard');
    
    if (!response.ok) {
      console.error('❌ Erro na resposta:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    
    console.log('📊 DADOS DO DASHBOARD:');
    console.log('   Locações Ativas:', data.locacoesAtivas || 'N/A');
    console.log('   Veículos Disponíveis:', data.veiculosDisponiveis || 'N/A');
    console.log('   Veículos Locados:', data.veiculosLocados || 'N/A');
    console.log('   Receita do Mês:', data.receitaMes || 'N/A');
    console.log('   Receita de Seguro:', data.receitaSeguro || 'N/A');
    console.log('   Saldo em Caixa:', data.saldoCaixa || 'N/A');

    console.log('\n🎯 ANÁLISE:');
    if (data.receitaSeguro === 100) {
      console.log('✅ Receita de seguro está correta: R$ 100');
    } else {
      console.log(`⚠️  Receita de seguro incorreta: R$ ${data.receitaSeguro} (deveria ser R$ 100)`);
    }

    if (data.locacoesAtivas === 2) {
      console.log('✅ Número de locações ativas está correto: 2');
    } else {
      console.log(`⚠️  Número de locações ativas incorreto: ${data.locacoesAtivas} (deveria ser 2)`);
    }

    console.log('\n📋 RESPOSTA COMPLETA:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar dashboard:', error.message);
  }
}

testarDashboard();