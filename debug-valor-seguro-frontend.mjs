import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugValorSeguroFrontend() {
  console.log('🔍 Debugando valor do seguro no frontend...\n');

  try {
    // 1. Verificar dados no banco
    console.log('📋 Verificando dados no banco...');
    const { data: locacoes, error: errorLocacoes } = await supabase
      .from('locacoes')
      .select(`
        id, 
        valor_seguro, 
        cliente_id, 
        veiculo_id,
        data_locacao,
        data_entrega,
        valor_diaria,
        valor_total,
        valor_caucao,
        status,
        observacoes,
        clientes(nome),
        veiculos(modelo, placa)
      `)
      .eq('status', 'ativa')
      .order('id', { ascending: false });

    if (errorLocacoes) {
      console.error('❌ Erro ao buscar locações:', errorLocacoes);
      return;
    }

    if (!locacoes || locacoes.length === 0) {
      console.log('❌ Nenhuma locação ativa encontrada');
      return;
    }

    console.log('✅ Locações encontradas:');
    locacoes.forEach((locacao, index) => {
      console.log(`\n${index + 1}. Locação #${locacao.id}:`);
      console.log(`   Cliente: ${locacao.clientes?.nome || 'N/A'}`);
      console.log(`   Veículo: ${locacao.veiculos?.modelo || 'N/A'} - ${locacao.veiculos?.placa || 'N/A'}`);
      console.log(`   Valor Seguro: R$ ${locacao.valor_seguro || 0}`);
      console.log(`   Valor Total: R$ ${locacao.valor_total || 0}`);
      console.log(`   Valor Caução: R$ ${locacao.valor_caucao || 0}`);
      console.log(`   Status: ${locacao.status}`);
    });

    // 2. Simular o que o frontend recebe
    console.log('\n🔄 Simulando dados que o frontend receberia...');
    const locacaoTeste = locacoes[0];
    
    console.log('\nDados originais do banco:');
    console.log(JSON.stringify(locacaoTeste, null, 2));

    // Simular o handleEdit
    console.log('\n📝 Simulando handleEdit...');
    const formDataSimulado = {
      cliente_id: locacaoTeste.cliente_id,
      veiculo_id: locacaoTeste.veiculo_id,
      data_locacao: locacaoTeste.data_locacao,
      data_entrega: locacaoTeste.data_entrega,
      valor_diaria: locacaoTeste.valor_diaria,
      valor_total: locacaoTeste.valor_total,
      valor_caucao: locacaoTeste.valor_caucao || 0,
      valor_seguro: locacaoTeste.valor_seguro || 0,
      status: locacaoTeste.status,
      observacoes: locacaoTeste.observacoes || '',
    };

    console.log('FormData que seria criado:');
    console.log(JSON.stringify(formDataSimulado, null, 2));

    // 3. Verificar o que apareceria no input
    console.log('\n🎯 Valor que apareceria no input:');
    console.log(`   formData.valor_seguro: ${formDataSimulado.valor_seguro}`);
    console.log(`   formData.valor_seguro || '': ${formDataSimulado.valor_seguro || ''}`);
    console.log(`   Tipo: ${typeof formDataSimulado.valor_seguro}`);

    // 4. Testar a API que o frontend usa
    console.log('\n🌐 Testando API que o frontend usa...');
    try {
      const response = await fetch('http://localhost:5174/api/locacoes');
      if (response.ok) {
        const apiData = await response.json();
        console.log('✅ API respondeu com sucesso');
        
        const locacaoAPI = apiData.find(l => l.id === locacaoTeste.id);
        if (locacaoAPI) {
          console.log(`   Valor seguro via API: R$ ${locacaoAPI.valor_seguro || 0}`);
          console.log(`   Tipo via API: ${typeof locacaoAPI.valor_seguro}`);
        } else {
          console.log('❌ Locação não encontrada na API');
        }
      } else {
        console.log('❌ Erro ao acessar API:', response.status);
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugValorSeguroFrontend();