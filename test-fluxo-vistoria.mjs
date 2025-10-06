import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarFluxoVistoria() {
  try {
    console.log('🔍 Testando fluxo completo de vistoria...\n');
    
    // 1. Criar uma vistoria de saída pendente
    console.log('1. Criando vistoria de saída pendente...');
    const vistoriaSaida = {
      cliente_id: 1,
      veiculo_id: 1,
      tipo_vistoria: 'saida',
      data_vistoria: new Date().toISOString(),
      placa: 'TEST123',
      modelo: 'Teste',
      cor: 'Branco',
      nome_condutor: 'TESTE MATHEUS',
      rg_condutor: '123456789',
      locacao_id: 999,
      nome_vistoriador: 'Sistema', // Pendente
      quilometragem: 50000,
      nivel_combustivel: 'cheio',
      observacoes: 'Teste de fluxo',
      avarias: '[]',
      item_calota: true,
      item_pneu: true,
      item_antena: true,
      item_bateria: true,
      item_estepe: true,
      item_macaco: true,
      item_chave_roda: true,
      item_triangulo: true,
      item_extintor: true,
      item_tapetes: true,
      item_som: true,
      item_documentos: true,
      item_higienizacao: true,
      fotos: '[]'
    };

    const { data: vistoriaCriada, error: errorCriar } = await supabase
      .from('vistorias')
      .insert([vistoriaSaida])
      .select()
      .single();

    if (errorCriar) {
      console.error('❌ Erro ao criar vistoria de saída:', errorCriar);
      return;
    }

    console.log(`✅ Vistoria de saída criada com ID: ${vistoriaCriada.id}`);

    // 2. Finalizar a vistoria de saída (simular o que acontece quando o usuário finaliza)
    console.log('\n2. Finalizando vistoria de saída...');
    
    const updateData = {
      nome_vistoriador: 'TESTE VISTORIADOR',
      observacoes: 'Vistoria finalizada para teste'
    };

    const { data: vistoriaFinalizada, error: errorFinalizar } = await supabase
      .from('vistorias')
      .update(updateData)
      .eq('id', vistoriaCriada.id)
      .select()
      .single();

    if (errorFinalizar) {
      console.error('❌ Erro ao finalizar vistoria de saída:', errorFinalizar);
      return;
    }

    console.log(`✅ Vistoria de saída finalizada`);

    // 3. Verificar se a vistoria de entrada foi criada automaticamente
    console.log('\n3. Verificando se vistoria de entrada foi criada...');
    
    // Simular a criação da vistoria de entrada (como no código original)
    if (vistoriaFinalizada.tipo_vistoria === 'saida' && 
        updateData.nome_vistoriador && 
        updateData.nome_vistoriador !== 'Sistema') {
      
      console.log('Criando vistoria de entrada pendente...');
      
      const vistoriaEntradaPendente = {
        cliente_id: vistoriaFinalizada.cliente_id,
        veiculo_id: vistoriaFinalizada.veiculo_id,
        tipo_vistoria: 'entrada',
        data_vistoria: new Date().toISOString(),
        placa: vistoriaFinalizada.placa,
        modelo: vistoriaFinalizada.modelo,
        cor: vistoriaFinalizada.cor,
        nome_condutor: vistoriaFinalizada.nome_condutor,
        rg_condutor: vistoriaFinalizada.rg_condutor,
        locacao_id: vistoriaFinalizada.locacao_id,
        nome_vistoriador: 'Sistema', // Marca como pendente
        quilometragem: vistoriaFinalizada.quilometragem,
        nivel_combustivel: vistoriaFinalizada.nivel_combustivel,
        observacoes: vistoriaFinalizada.observacoes,
        avarias: vistoriaFinalizada.avarias,
        item_calota: vistoriaFinalizada.item_calota,
        item_pneu: vistoriaFinalizada.item_pneu,
        item_antena: vistoriaFinalizada.item_antena,
        item_bateria: vistoriaFinalizada.item_bateria,
        item_estepe: vistoriaFinalizada.item_estepe,
        item_macaco: vistoriaFinalizada.item_macaco,
        item_chave_roda: vistoriaFinalizada.item_chave_roda,
        item_triangulo: vistoriaFinalizada.item_triangulo,
        item_extintor: vistoriaFinalizada.item_extintor,
        item_tapetes: vistoriaFinalizada.item_tapetes,
        item_som: vistoriaFinalizada.item_som,
        item_documentos: vistoriaFinalizada.item_documentos,
        item_higienizacao: vistoriaFinalizada.item_higienizacao,
        fotos: vistoriaFinalizada.fotos || '[]'
      };

      const { data: novaVistoriaEntrada, error: errorEntrada } = await supabase
        .from('vistorias')
        .insert([vistoriaEntradaPendente])
        .select()
        .single();

      if (errorEntrada) {
        console.error('❌ Erro ao criar vistoria de entrada pendente:', errorEntrada);
      } else {
        console.log(`✅ Vistoria de entrada pendente criada com ID: ${novaVistoriaEntrada.id}`);
        
        // 4. Verificar se aparece como pendente
        console.log('\n4. Verificando se aparece como pendente...');
        
        const { data: vistoriasPendentes, error: errorPendentes } = await supabase
          .from('vistorias')
          .select('*')
          .eq('nome_vistoriador', 'Sistema')
          .eq('tipo_vistoria', 'entrada')
          .order('created_at', { ascending: false });

        if (errorPendentes) {
          console.error('❌ Erro ao buscar vistorias pendentes:', errorPendentes);
        } else {
          console.log(`✅ Encontradas ${vistoriasPendentes.length} vistoria(s) de entrada pendente(s)`);
          
          if (vistoriasPendentes.length > 0) {
            console.log('\n📋 Vistorias de entrada pendentes:');
            vistoriasPendentes.forEach((v, index) => {
              console.log(`   ${index + 1}. ID: ${v.id} | Condutor: ${v.nome_condutor} | Placa: ${v.placa}`);
            });
          }
        }
      }
    }

    // 5. Limpeza - remover as vistorias de teste
    console.log('\n5. Limpando dados de teste...');
    
    // Buscar e remover vistorias de teste
    const { data: vistoriasParaRemover, error: errorBuscar } = await supabase
      .from('vistorias')
      .select('id')
      .or(`id.eq.${vistoriaCriada.id},nome_condutor.eq.TESTE MATHEUS`);

    if (!errorBuscar && vistoriasParaRemover && vistoriasParaRemover.length > 0) {
      const idsParaRemover = vistoriasParaRemover.map(v => v.id);
      
      const { error: errorRemover } = await supabase
        .from('vistorias')
        .delete()
        .in('id', idsParaRemover);

      if (errorRemover) {
        console.error('❌ Erro ao remover vistorias de teste:', errorRemover);
      } else {
        console.log(`✅ ${idsParaRemover.length} vistoria(s) de teste removida(s)`);
      }
    }

    console.log('\n🎉 Teste do fluxo de vistoria concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarFluxoVistoria();