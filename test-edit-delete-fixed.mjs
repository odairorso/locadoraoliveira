import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNzI4MDAsImV4cCI6MjA0NDc0ODgwMH0.example';

console.log('=== TESTE DE EDIÇÃO E EXCLUSÃO DE LOCAÇÕES (ESTRUTURA CORRIGIDA) ===');

async function testEditDeleteOperations() {
  try {
    // 1. Buscar locações existentes
    console.log('\n1. Buscando locações existentes...');
    const response = await fetch('http://localhost:5174/api/locacoes');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar locações: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Encontradas ${data.data.length} locações`);
    
    if (data.data.length === 0) {
      console.log('❌ Nenhuma locação encontrada para testar');
      return;
    }
    
    // Usar a primeira locação para teste
    const locacaoTeste = data.data[0];
    console.log(`Usando locação ID ${locacaoTeste.id} para teste`);
    console.log('Dados originais:', {
      id: locacaoTeste.id,
      observacoes: locacaoTeste.observacoes,
      status: locacaoTeste.status
    });
    
    // 2. Testar operação PUT (edição)
    console.log('\n2. Testando operação PUT (edição)...');
    const updateData = {
      observacoes: `Teste de edição - ${new Date().toISOString()}`
    };
    
    const putResponse = await fetch(`http://localhost:5174/api/locacoes/${locacaoTeste.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log(`Status da resposta PUT: ${putResponse.status}`);
    
    if (putResponse.ok) {
      const putResult = await putResponse.json();
      console.log('✅ Edição realizada com sucesso!');
      console.log('Dados atualizados:', putResult.data);
      
      // 3. Verificar se a edição foi aplicada
      console.log('\n3. Verificando se a edição foi aplicada...');
      const verifyResponse = await fetch('http://localhost:5174/api/locacoes');
      const verifyData = await verifyResponse.json();
      const locacaoAtualizada = verifyData.data.find(l => l.id === locacaoTeste.id);
      
      if (locacaoAtualizada && locacaoAtualizada.observacoes === updateData.observacoes) {
        console.log('✅ Verificação confirmada: edição foi aplicada corretamente');
      } else {
        console.log('❌ Verificação falhou: edição não foi aplicada');
      }
      
    } else {
      const putError = await putResponse.text();
      console.log('❌ Erro na edição:', putError);
    }
    
    // 4. Testar operação DELETE apenas se houver mais de uma locação
    if (data.data.length > 1) {
      console.log('\n4. Testando operação DELETE (exclusão)...');
      
      const deleteResponse = await fetch(`http://localhost:5174/api/locacoes/${locacaoTeste.id}`, {
        method: 'DELETE'
      });
      
      console.log(`Status da resposta DELETE: ${deleteResponse.status}`);
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Exclusão realizada com sucesso!');
        console.log('Resultado:', deleteResult);
        
        // 5. Verificar se a exclusão foi aplicada
        console.log('\n5. Verificando se a exclusão foi aplicada...');
        const verifyDeleteResponse = await fetch('http://localhost:5174/api/locacoes');
        const verifyDeleteData = await verifyDeleteResponse.json();
        const locacaoExcluida = verifyDeleteData.data.find(l => l.id === locacaoTeste.id);
        
        if (!locacaoExcluida) {
          console.log('✅ Verificação confirmada: locação foi excluída corretamente');
        } else {
          console.log('❌ Verificação falhou: locação ainda existe');
        }
        
      } else {
        const deleteError = await deleteResponse.text();
        console.log('❌ Erro na exclusão:', deleteError);
      }
    } else {
      console.log('\n4. ⚠️ Pulando teste de DELETE: apenas uma locação disponível');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testEditDeleteOperations();