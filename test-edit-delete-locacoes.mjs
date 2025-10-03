import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEditDeleteLocacoes() {
  console.log('=== TESTE DE EDIÇÃO E EXCLUSÃO DE LOCAÇÕES ===\n');
  
  try {
    // 1. Buscar uma locação existente para testar
    console.log('1. Buscando locações existentes...');
    const { data: locacoes, error: locacoesError } = await supabase
      .from('locacoes')
      .select('*')
      .limit(5);
    
    if (locacoesError) {
      console.error('Erro ao buscar locações:', locacoesError);
      return;
    }
    
    console.log(`Encontradas ${locacoes?.length || 0} locações`);
    
    if (!locacoes || locacoes.length === 0) {
      console.log('Nenhuma locação encontrada para testar');
      return;
    }
    
    const locacaoTeste = locacoes[0];
    console.log('Locação para teste:', {
      id: locacaoTeste.id,
      cliente_id: locacaoTeste.cliente_id,
      veiculo_id: locacaoTeste.veiculo_id,
      status: locacaoTeste.status,
      valor_total: locacaoTeste.valor_total
    });
    
    // 2. Testar edição (PUT)
    console.log('\n2. Testando edição da locação...');
    
    // Simular requisição PUT como o frontend faz
    const updateData = {
      observacoes: `Teste de edição - ${new Date().toISOString()}`
    };
    
    const putResponse = await fetch(`http://localhost:5174/api/locacoes/${locacaoTeste.id}?id=${locacaoTeste.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Status da resposta PUT:', putResponse.status);
    const putResult = await putResponse.json();
    console.log('Resultado PUT:', putResult);
    
    if (putResult.success) {
      console.log('✅ Edição funcionou corretamente');
    } else {
      console.log('❌ Erro na edição:', putResult.error);
    }
    
    // 3. Verificar se a edição foi aplicada
    console.log('\n3. Verificando se a edição foi aplicada...');
    const { data: locacaoAtualizada, error: verificacaoError } = await supabase
      .from('locacoes')
      .select('observacoes')
      .eq('id', locacaoTeste.id)
      .single();
    
    if (verificacaoError) {
      console.error('Erro ao verificar edição:', verificacaoError);
    } else {
      console.log('Observações atualizadas:', locacaoAtualizada.observacoes);
    }
    
    // 4. Testar exclusão (DELETE) - CUIDADO: só fazer se houver mais de uma locação
    if (locacoes.length > 1) {
      console.log('\n4. Testando exclusão da locação...');
      
      const deleteResponse = await fetch(`http://localhost:5174/api/locacoes/${locacaoTeste.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Status da resposta DELETE:', deleteResponse.status);
      const deleteResult = await deleteResponse.json();
      console.log('Resultado DELETE:', deleteResult);
      
      if (deleteResult.success) {
        console.log('✅ Exclusão funcionou corretamente');
        
        // Verificar se foi realmente excluída
        const { data: locacaoVerificacao, error: verificacaoDeleteError } = await supabase
          .from('locacoes')
          .select('id')
          .eq('id', locacaoTeste.id)
          .single();
        
        if (verificacaoDeleteError && verificacaoDeleteError.code === 'PGRST116') {
          console.log('✅ Locação foi realmente excluída do banco');
        } else {
          console.log('❌ Locação ainda existe no banco:', locacaoVerificacao);
        }
      } else {
        console.log('❌ Erro na exclusão:', deleteResult.error);
      }
    } else {
      console.log('\n4. Pulando teste de exclusão (apenas 1 locação disponível)');
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testEditDeleteLocacoes();