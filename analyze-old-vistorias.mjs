import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeOldInspections() {
  console.log('🔍 Analisando vistorias antigas...');
  
  try {
    // Buscar todas as vistorias ordenadas por data
    const { data: vistorias, error } = await supabase
      .from('vistorias')
      .select(`
        id,
        tipo_vistoria,
        placa,
        nome_vistoriador,
        created_at,
        data_vistoria,
        locacao_id,
        cliente_id,
        veiculo_id,
        clientes:cliente_id(nome),
        veiculos:veiculo_id(marca, modelo)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vistorias:', error);
      return;
    }

    console.log(`📋 Total de vistorias encontradas: ${vistorias.length}`);
    
    // Agrupar por veículo e analisar
    const vistoriasPorVeiculo = {};
    
    vistorias.forEach(vistoria => {
      const key = `${vistoria.placa}_${vistoria.veiculo_id}`;
      if (!vistoriasPorVeiculo[key]) {
        vistoriasPorVeiculo[key] = [];
      }
      vistoriasPorVeiculo[key].push(vistoria);
    });

    console.log('\n📊 Análise por veículo:');
    
    let totalVistoriasAntigas = 0;
    const vistoriasParaRemover = [];
    
    Object.keys(vistoriasPorVeiculo).forEach(veiculo => {
      const vistoriasVeiculo = vistoriasPorVeiculo[veiculo];
      console.log(`\n🚗 Veículo: ${vistoriasVeiculo[0].placa} (${vistoriasVeiculo[0].veiculos?.marca} ${vistoriasVeiculo[0].veiculos?.modelo})`);
      console.log(`   Total de vistorias: ${vistoriasVeiculo.length}`);
      
      // Mostrar as 3 mais recentes
      const recentes = vistoriasVeiculo.slice(0, 3);
      console.log('   📅 Vistorias mais recentes:');
      recentes.forEach((v, index) => {
        const data = new Date(v.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ID: ${v.id} | ${v.tipo_vistoria} | ${v.nome_vistoriador || 'Sem vistoriador'} | ${data}`);
      });
      
      // Se há mais de 3 vistorias, as antigas podem ser candidatas à remoção
      if (vistoriasVeiculo.length > 3) {
        const antigas = vistoriasVeiculo.slice(3);
        console.log(`   🗑️  Vistorias antigas (candidatas à remoção): ${antigas.length}`);
        antigas.forEach(v => {
          const data = new Date(v.created_at).toLocaleString('pt-BR');
          console.log(`      ID: ${v.id} | ${v.tipo_vistoria} | ${v.nome_vistoriador || 'Sem vistoriador'} | ${data}`);
          vistoriasParaRemover.push(v);
        });
        totalVistoriasAntigas += antigas.length;
      }
    });

    console.log(`\n📊 Resumo da análise:`);
    console.log(`   Total de vistorias: ${vistorias.length}`);
    console.log(`   Vistorias antigas (candidatas à remoção): ${totalVistoriasAntigas}`);
    console.log(`   Vistorias que permaneceriam: ${vistorias.length - totalVistoriasAntigas}`);
    
    if (vistoriasParaRemover.length > 0) {
      console.log(`\n🗑️  IDs das vistorias candidatas à remoção:`);
      console.log(vistoriasParaRemover.map(v => v.id).join(', '));
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeOldInspections();