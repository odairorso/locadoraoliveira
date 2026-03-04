import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function corrigirVistoriasInconsistentes() {
  console.log('Iniciando correção de vistorias inconsistentes...');
  
  try {
    // Buscar todas as vistorias de saída finalizadas (nome_vistoriador != 'Sistema')
    const { data: vistoriasSaida, error: errorSaida } = await supabase
      .from('vistorias')
      .select('id, locacao_id, cliente_id, veiculo_id, tipo_vistoria, nome_vistoriador')
      .eq('tipo_vistoria', 'saida')
      .neq('nome_vistoriador', 'Sistema');
    
    if (errorSaida) {
      console.error('Erro ao buscar vistorias de saída:', errorSaida);
      return;
    }
    
    console.log(`Encontradas ${vistoriasSaida.length} vistorias de saída finalizadas`);
    
    // Para cada vistoria de saída, verificar se existe uma vistoria de entrada pendente
    for (const vistoriaSaida of vistoriasSaida) {
      // Verificar se já existe uma vistoria de entrada para esta locação
      const { data: vistoriasEntrada, error: errorEntrada } = await supabase
        .from('vistorias')
        .select('id')
        .eq('locacao_id', vistoriaSaida.locacao_id)
        .eq('tipo_vistoria', 'entrada')
        .eq('nome_vistoriador', 'Sistema');
      
      if (errorEntrada) {
        console.error(`Erro ao buscar vistorias de entrada para locação ${vistoriaSaida.locacao_id}:`, errorEntrada);
        continue;
      }
      
      // Se não existe vistoria de entrada pendente, criar uma
      if (!vistoriasEntrada || vistoriasEntrada.length === 0) {
        console.log(`Criando vistoria de entrada pendente para locação ${vistoriaSaida.locacao_id}`);
        
        // Buscar os dados completos da vistoria de saída
        const { data: vistoriaSaidaCompleta, error: errorCompleta } = await supabase
          .from('vistorias')
          .select('*')
          .eq('id', vistoriaSaida.id)
          .single();
        
        if (errorCompleta) {
          console.error(`Erro ao buscar dados completos da vistoria de saída ${vistoriaSaida.id}:`, errorCompleta);
          continue;
        }
        
        // Criar vistoria de entrada pendente copiando os dados da vistoria de saída
        const vistoriaEntradaPendente = {
          cliente_id: vistoriaSaidaCompleta.cliente_id,
          veiculo_id: vistoriaSaidaCompleta.veiculo_id,
          tipo_vistoria: 'entrada',
          placa: vistoriaSaidaCompleta.placa,
          modelo: vistoriaSaidaCompleta.modelo,
          cor: vistoriaSaidaCompleta.cor,
          nome_condutor: vistoriaSaidaCompleta.nome_condutor,
          rg_condutor: vistoriaSaidaCompleta.rg_condutor,
          locacao_id: vistoriaSaidaCompleta.locacao_id,
          nome_vistoriador: 'Sistema', // Marca como pendente
          // Copiar dados da vistoria de saída para comparação
          quilometragem: vistoriaSaidaCompleta.quilometragem,
          nivel_combustivel: vistoriaSaidaCompleta.nivel_combustivel,
          observacoes: vistoriaSaidaCompleta.observacoes,
          telefone_condutor: vistoriaSaidaCompleta.telefone_condutor,
          // Copiar avarias da vistoria de saída
          avarias: vistoriaSaidaCompleta.avarias,
          // Copiar todo o checklist
          item_calota: vistoriaSaidaCompleta.item_calota,
          item_pneu: vistoriaSaidaCompleta.item_pneu,
          item_antena: vistoriaSaidaCompleta.item_antena,
          item_bateria: vistoriaSaidaCompleta.item_bateria,
          item_estepe: vistoriaSaidaCompleta.item_estepe,
          item_macaco: vistoriaSaidaCompleta.item_macaco,
          item_chave_roda: vistoriaSaidaCompleta.item_chave_roda,
          item_triangulo: vistoriaSaidaCompleta.item_triangulo,
          item_extintor: vistoriaSaidaCompleta.item_extintor,
          item_tapetes: vistoriaSaidaCompleta.item_tapetes,
          item_som: vistoriaSaidaCompleta.item_som,
          item_documentos: vistoriaSaidaCompleta.item_documentos,
          item_higienizacao: vistoriaSaidaCompleta.item_higienizacao,
          // Copiar as fotos da vistoria de saída
          fotos: vistoriaSaidaCompleta.fotos
        };
        
        const { data: novaVistoriaEntrada, error: errorCriacao } = await supabase
          .from('vistorias')
          .insert([vistoriaEntradaPendente])
          .select()
          .single();
        
        if (errorCriacao) {
          console.error(`Erro ao criar vistoria de entrada pendente para locação ${vistoriaSaida.locacao_id}:`, errorCriacao);
        } else {
          console.log(`Vistoria de entrada pendente criada com sucesso: ID ${novaVistoriaEntrada.id}`);
        }
      } else {
        console.log(`Já existe vistoria de entrada pendente para locação ${vistoriaSaida.locacao_id}`);
      }
    }
    
    console.log('Correção de vistorias inconsistentes concluída!');
  } catch (error) {
    console.error('Erro geral na correção de vistorias:', error);
  }
}

// Executar a função se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  corrigirVistoriasInconsistentes();
}

export default corrigirVistoriasInconsistentes;