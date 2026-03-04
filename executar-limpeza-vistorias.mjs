import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do Supabase com fallback para valores hardcoded
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtjeqtqzlpqvqr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0amVxdHF6bHBxdnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ0NzQsImV4cCI6MjA1MDU1MDQ3NH0.Ey8Ej6Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarVistoriasPendentes() {
  try {
    console.log('📥 Criando vistorias de entrada pendentes...\n');

    // Buscar dados dos veículos com vistoria de saída
    const { data: veiculos, error: veiculosError } = await supabase
      .from('veiculos')
      .select('*')
      .in('placa', ['RMJ8A24', 'STK8B96']);

    if (veiculosError) {
      console.error('❌ Erro ao buscar veículos:', veiculosError);
      return;
    }

    console.log(`✅ Encontrados ${veiculos.length} veículos`);

    // Criar vistorias de entrada pendentes para os 2 veículos
    for (const veiculo of veiculos) {
      console.log(`\n🚗 Processando veículo: ${veiculo.placa} (${veiculo.modelo})`);
      
      // Buscar o cliente associado ao veículo
      const { data: locacoes, error: locacoesError } = await supabase
        .from('locacoes')
        .select('cliente_id')
        .eq('veiculo_id', veiculo.id)
        .eq('status', 'ativa')
        .limit(1);

      let clienteId = null;
      if (locacoes && locacoes.length > 0) {
        clienteId = locacoes[0].cliente_id;
        console.log(`   📋 Cliente encontrado via locação ativa: ${clienteId}`);
      } else {
        // Se não há locação ativa, buscar a mais recente
        const { data: ultimaLocacao } = await supabase
          .from('locacoes')
          .select('cliente_id')
          .eq('veiculo_id', veiculo.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (ultimaLocacao && ultimaLocacao.length > 0) {
          clienteId = ultimaLocacao[0].cliente_id;
          console.log(`   📋 Cliente encontrado via última locação: ${clienteId}`);
        } else {
          console.log(`   ⚠️ Nenhum cliente encontrado para ${veiculo.placa}, usando cliente padrão`);
          // Buscar o primeiro cliente disponível
          const { data: primeiroCliente } = await supabase
            .from('clientes')
            .select('id')
            .limit(1);
          
          if (primeiroCliente && primeiroCliente.length > 0) {
            clienteId = primeiroCliente[0].id;
            console.log(`   📋 Usando primeiro cliente disponível: ${clienteId}`);
          }
        }
      }

      if (!clienteId) {
        console.error(`   ❌ Não foi possível encontrar cliente para ${veiculo.placa}`);
        continue;
      }

      // Criar vistoria de entrada pendente com estrutura correta
      const novaVistoria = {
        veiculo_id: veiculo.id,
        cliente_id: clienteId,
        tipo_vistoria: 'entrada',
        nome_vistoriador: 'Sistema', // Importante: Sistema para aparecer como pendente
        data_vistoria: null, // Null porque ainda não foi realizada
        observacoes: 'Vistoria de entrada pendente - aguardando realização',
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        cor: veiculo.cor,
        // Campos obrigatórios baseados na estrutura real
        quilometragem: 0,
        nivel_combustivel: 'vazio',
        nome_condutor: '',
        rg_condutor: '',
        assinatura_cliente: null,
        assinatura_vistoriador: null,
        avarias: null,
        fotos: '[]',
        // Inicializar todos os itens do checklist como false
        item_calota: false,
        item_pneu: false,
        item_antena: false,
        item_bateria: false,
        item_estepe: false,
        item_macaco: false,
        item_chave_roda: false,
        item_triangulo: false,
        item_extintor: false,
        item_tapetes: false,
        item_som: false,
        item_documentos: false,
        item_higienizacao: false
      };

      console.log(`   📝 Criando vistoria pendente...`);
      
      const { data: vistoriaCriada, error: criarError } = await supabase
        .from('vistorias')
        .insert(novaVistoria)
        .select()
        .single();

      if (criarError) {
        console.error(`   ❌ Erro ao criar vistoria para ${veiculo.placa}:`, criarError);
      } else {
        console.log(`   ✅ Vistoria de entrada pendente criada (ID: ${vistoriaCriada.id})`);
      }
    }

    console.log('\n🎉 CRIAÇÃO DE VISTORIAS PENDENTES FINALIZADA!');
    
    // Verificar resultado final
    console.log('\n📊 VERIFICANDO RESULTADO FINAL...');
    const { data: vistoriasFinais, error: finalError } = await supabase
      .from('vistorias')
      .select(`
        *,
        clientes(nome),
        veiculos(placa, modelo)
      `)
      .order('created_at', { ascending: false });

    if (!finalError && vistoriasFinais) {
      console.log(`\n📋 Total de vistorias no sistema: ${vistoriasFinais.length}`);
      
      const pendentes = vistoriasFinais.filter(v => v.nome_vistoriador === 'Sistema');
      console.log(`🔄 Vistorias pendentes: ${pendentes.length}`);
      
      pendentes.forEach(v => {
        console.log(`   - ${v.veiculos?.placa}: ${v.tipo_vistoria} (ID: ${v.id})`);
      });

      const realizadas = vistoriasFinais.filter(v => v.nome_vistoriador !== 'Sistema');
      console.log(`✅ Vistorias realizadas: ${realizadas.length}`);
      
      realizadas.forEach(v => {
        console.log(`   - ${v.veiculos?.placa}: ${v.tipo_vistoria} por ${v.nome_vistoriador} (ID: ${v.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral na criação:', error);
  }
}

// Executar criação
criarVistoriasPendentes();