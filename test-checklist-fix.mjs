// Script para testar as correções do checklist
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarVistorias() {
  console.log('🔍 Testando API de vistorias...\n');
  
  try {
    // Teste 1: Buscar todas as vistorias
    console.log('1. Buscando todas as vistorias...');
    const { data: vistorias, error: vistoriasError } = await supabase
      .from('vistorias')
      .select(`
        *,
        clientes:cliente_id(nome, cpf),
        veiculos:veiculo_id(marca, modelo, placa)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (vistoriasError) {
      console.error('❌ Erro ao buscar vistorias:', vistoriasError);
      return false;
    }
    
    console.log(`✅ Encontradas ${vistorias?.length || 0} vistorias`);
    
    // Teste 2: Buscar uma vistoria específica (se existir)
    if (vistorias && vistorias.length > 0) {
      const primeiraVistoria = vistorias[0];
      console.log(`\n2. Buscando vistoria específica (ID: ${primeiraVistoria.id})...`);
      
      const { data: vistoria, error: vistoriaError } = await supabase
        .from('vistorias')
        .select(`
          *,
          clientes:cliente_id(nome, cpf, telefone),
          veiculos:veiculo_id(marca, modelo, placa, cor, ano)
        `)
        .eq('id', primeiraVistoria.id)
        .single();
      
      if (vistoriaError) {
        console.error('❌ Erro ao buscar vistoria específica:', vistoriaError);
        return false;
      }
      
      console.log('✅ Vistoria específica encontrada:', {
        id: vistoria.id,
        tipo: vistoria.tipo_vistoria,
        placa: vistoria.veiculos?.placa || 'N/A',
        cliente: vistoria.clientes?.nome || 'N/A'
      });
      
      // Teste 3: Verificar se a estrutura está correta
      console.log('\n3. Verificando estrutura de dados...');
      const temCliente = vistoria.clientes !== null;
      const temVeiculo = vistoria.veiculos !== null;
      const temDadosBasicos = vistoria.id && vistoria.tipo_vistoria;
      
      console.log(`   - Tem cliente: ${temCliente ? '✅' : '❌'}`);
      console.log(`   - Tem veículo: ${temVeiculo ? '✅' : '❌'}`);
      console.log(`   - Tem dados básicos: ${temDadosBasicos ? '✅' : '❌'}`);
      
      return temCliente && temVeiculo && temDadosBasicos;
    } else {
      console.log('⚠️  Nenhuma vistoria encontrada para teste específico');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

async function testarLocacoes() {
  console.log('\n🔍 Testando locações ativas...\n');
  
  try {
    const { data: locacoes, error: locacoesError } = await supabase
      .from('locacoes')
      .select(`
        *,
        clientes:cliente_id(nome, cpf, celular),
        veiculos:veiculo_id(marca, modelo, placa, cor)
      `)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (locacoesError) {
      console.error('❌ Erro ao buscar locações:', locacoesError);
      return false;
    }
    
    console.log(`✅ Encontradas ${locacoes?.length || 0} locações ativas`);
    
    if (locacoes && locacoes.length > 0) {
      console.log('\n📋 Locações ativas:');
      locacoes.forEach((locacao, index) => {
        console.log(`   ${index + 1}. ${locacao.clientes?.nome || 'Cliente N/A'} - ${locacao.veiculos?.marca || 'N/A'} ${locacao.veiculos?.modelo || 'N/A'} (${locacao.veiculos?.placa || 'N/A'})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar locações:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 INICIANDO TESTES DAS CORREÇÕES DO CHECKLIST\n');
  console.log('═'.repeat(50));
  
  const testeVistorias = await testarVistorias();
  const testeLocacoes = await testarLocacoes();
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESULTADOS DOS TESTES:');
  console.log(`   - API Vistorias: ${testeVistorias ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   - API Locações: ${testeLocacoes ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (testeVistorias && testeLocacoes) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! As correções estão funcionando.');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Testar manualmente no navegador');
    console.log('   2. Acessar: http://localhost:5173/checklist');
    console.log('   3. Clicar em uma vistoria para verificar se abre');
    console.log('   4. Se funcionar, fazer commit das alterações');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verificar configurações antes do commit.');
  }
}

main().catch(console.error);
