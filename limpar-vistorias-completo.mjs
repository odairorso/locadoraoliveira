import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do Supabase com fallback para valores hardcoded
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtjeqtqzlpqvqr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0amVxdHF6bHBxdnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ0NzQsImV4cCI6MjA1MDU1MDQ3NH0.Ey8Ej6Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analisarELimparVistorias() {
  try {
    console.log('🔍 Analisando estado atual das vistorias...\n');

    // 1. Buscar todas as vistorias
    const { data: vistorias, error } = await supabase
      .from('vistorias')
      .select(`
        *,
        clientes(nome),
        veiculos(placa, modelo)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vistorias:', error);
      return;
    }

    console.log(`📊 Total de vistorias encontradas: ${vistorias.length}\n`);

    // 2. Agrupar por veículo e tipo
    const vistoriasPorVeiculo = {};
    
    vistorias.forEach(vistoria => {
      const veiculo = vistoria.veiculos?.placa || 'Sem placa';
      if (!vistoriasPorVeiculo[veiculo]) {
        vistoriasPorVeiculo[veiculo] = {
          entrada: [],
          saida: []
        };
      }
      
      if (vistoria.tipo_vistoria === 'entrada') {
        vistoriasPorVeiculo[veiculo].entrada.push(vistoria);
      } else if (vistoria.tipo_vistoria === 'saida') {
        vistoriasPorVeiculo[veiculo].saida.push(vistoria);
      }
    });

    // 3. Mostrar análise detalhada
    console.log('📋 ANÁLISE POR VEÍCULO:');
    console.log('='.repeat(50));
    
    Object.keys(vistoriasPorVeiculo).forEach(placa => {
      const dados = vistoriasPorVeiculo[placa];
      console.log(`\n🚗 ${placa}:`);
      console.log(`   Vistorias de Entrada: ${dados.entrada.length}`);
      console.log(`   Vistorias de Saída: ${dados.saida.length}`);
      
      // Mostrar detalhes das vistorias de saída
      if (dados.saida.length > 0) {
        console.log('   📤 Vistorias de Saída:');
        dados.saida.forEach(v => {
          console.log(`      - ID: ${v.id}, Data: ${v.data_vistoria}, Vistoriador: ${v.nome_vistoriador}`);
        });
      }
      
      // Mostrar detalhes das vistorias de entrada
      if (dados.entrada.length > 0) {
        console.log('   📥 Vistorias de Entrada:');
        dados.entrada.forEach(v => {
          console.log(`      - ID: ${v.id}, Data: ${v.data_vistoria}, Vistoriador: ${v.nome_vistoriador}, Status: ${v.nome_vistoriador === 'Sistema' ? 'PENDENTE' : 'REALIZADA'}`);
        });
      }
    });

    // 4. Identificar veículos com vistoria de saída
    const veiculosComSaida = Object.keys(vistoriasPorVeiculo).filter(placa => 
      vistoriasPorVeiculo[placa].saida.length > 0
    );

    console.log('\n🎯 VEÍCULOS COM VISTORIA DE SAÍDA:');
    console.log('='.repeat(40));
    veiculosComSaida.forEach(placa => {
      console.log(`✅ ${placa}`);
    });

    // 5. Identificar vistorias para remover
    const vistoriasParaRemover = [];
    
    vistorias.forEach(vistoria => {
      const placa = vistoria.veiculos?.placa || 'Sem placa';
      
      // Se o veículo NÃO tem vistoria de saída, remover TODAS as vistorias
      if (!veiculosComSaida.includes(placa)) {
        vistoriasParaRemover.push(vistoria);
      }
      // Se o veículo TEM vistoria de saída, manter apenas a última saída e criar entrada pendente
      else {
        const vistoriasSaidaVeiculo = vistoriasPorVeiculo[placa].saida;
        const ultimaSaida = vistoriasSaidaVeiculo.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        // Remover vistorias de saída antigas (exceto a última)
        if (vistoria.tipo_vistoria === 'saida' && vistoria.id !== ultimaSaida.id) {
          vistoriasParaRemover.push(vistoria);
        }
        
        // Remover TODAS as vistorias de entrada existentes (vamos criar novas pendentes)
        if (vistoria.tipo_vistoria === 'entrada') {
          vistoriasParaRemover.push(vistoria);
        }
      }
    });

    console.log('\n🗑️ VISTORIAS PARA REMOVER:');
    console.log('='.repeat(40));
    console.log(`Total: ${vistoriasParaRemover.length}`);
    
    vistoriasParaRemover.forEach(v => {
      console.log(`- ID: ${v.id}, Tipo: ${v.tipo_vistoria}, Veículo: ${v.veiculos?.placa}, Data: ${v.data_vistoria}`);
    });

    // 6. Confirmar antes de executar
    console.log('\n⚠️ AÇÃO NECESSÁRIA:');
    console.log('='.repeat(30));
    console.log('1. Remover vistorias listadas acima');
    console.log('2. Criar vistorias de entrada pendentes para veículos com saída');
    console.log('\n🔄 Execute o script novamente com confirmação para aplicar as mudanças.');

    return {
      veiculosComSaida,
      vistoriasParaRemover,
      vistoriasPorVeiculo
    };

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar análise
analisarELimparVistorias();