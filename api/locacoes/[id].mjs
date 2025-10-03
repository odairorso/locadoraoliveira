import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  const { method } = request;
  const { id } = request.query;

  try {
    if (method === 'PUT') {
      if (!id) {
        return response.status(400).json({ success: false, error: 'ID da locação inválido ou ausente.' });
      }
      const locacaoId = parseInt(id, 10);

      // 1. Fetch the existing location to get the veiculo_id
      const { data: currentLocacao, error: fetchError } = await supabase
        .from('locacoes')
        .select('veiculo_id, status')
        .eq('id', locacaoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar locação para atualização:', fetchError);
        return response.status(404).json({ success: false, error: 'Locação não encontrada.' });
      }

      // 2. Build the update object ONLY with fields present in the request body
      const updateData = {};
      const allowedFields = ['cliente_id', 'veiculo_id', 'data_locacao', 'data_entrega', 'valor_diaria', 'valor_total', 'valor_caucao', 'valor_seguro', 'status', 'observacoes'];
      
      for (const key in request.body) {
        if (allowedFields.includes(key)) {
          updateData[key] = request.body[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ success: false, error: 'Nenhum campo válido para atualização foi fornecido.' });
      }

      // 3. Perform the update
      const { data: updatedLocacao, error: updateError } = await supabase
        .from('locacoes')
        .update(updateData)
        .eq('id', locacaoId)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar locação:', updateError);
        return response.status(500).json({ success: false, error: 'Falha ao atualizar a locação no banco de dados.', details: updateError.message });
      }

      // 3.1. Se o valor_total foi atualizado, atualizar também a movimentação financeira correspondente
      if (updateData.valor_total !== undefined) {
        const { error: movUpdateError } = await supabase
          .from('movimentacoes_financeiras')
          .update({ 
            valor: updateData.valor_total,
            descricao: `Recebimento da Locação #${locacaoId} (Valor Atualizado)`
          })
          .eq('locacao_id', locacaoId)
          .eq('tipo', 'entrada')
          .eq('categoria', 'locacao');

        if (movUpdateError) {
          console.error('Erro ao atualizar movimentação financeira:', movUpdateError);
          // Log o erro mas não bloqueia a resposta, pois a locação já foi atualizada
        }
      }

      // 3.2. Se o valor_seguro foi atualizado, atualizar também a movimentação financeira do seguro
      if (updateData.valor_seguro !== undefined) {
        if (updateData.valor_seguro > 0) {
          // Verificar se já existe uma movimentação de seguro para esta locação
          const { data: existingSeguro, error: checkError } = await supabase
            .from('movimentacoes_financeiras')
            .select('id')
            .eq('locacao_id', locacaoId)
            .eq('tipo', 'entrada')
            .eq('categoria', 'seguro')
            .single();

          if (existingSeguro) {
            // Atualizar movimentação existente
            const { error: seguroUpdateError } = await supabase
              .from('movimentacoes_financeiras')
              .update({ 
                valor: updateData.valor_seguro,
                descricao: `Recebimento de Seguro - Locação #${locacaoId} (Valor Atualizado)`
              })
              .eq('id', existingSeguro.id);

            if (seguroUpdateError) {
              console.error('Erro ao atualizar movimentação financeira do seguro:', seguroUpdateError);
            }
          } else {
            // Criar nova movimentação de seguro
            const { error: seguroCreateError } = await supabase
              .from('movimentacoes_financeiras')
              .insert({
                tipo: 'entrada',
                categoria: 'seguro',
                descricao: `Recebimento de Seguro - Locação #${locacaoId}`,
                valor: updateData.valor_seguro,
                data_movimentacao: updatedLocacao.data_locacao,
                locacao_id: locacaoId,
                cliente_id: updatedLocacao.cliente_id,
              });

            if (seguroCreateError) {
              console.error('Erro ao criar movimentação financeira do seguro:', seguroCreateError);
            }
          }
        } else {
          // Se valor_seguro é 0, remover movimentação de seguro existente
          const { error: seguroDeleteError } = await supabase
            .from('movimentacoes_financeiras')
            .delete()
            .eq('locacao_id', locacaoId)
            .eq('tipo', 'entrada')
            .eq('categoria', 'seguro');

          if (seguroDeleteError) {
            console.error('Erro ao remover movimentação financeira do seguro:', seguroDeleteError);
          }
        }
      }

      // 4. If status changed to 'finalizada' or 'cancelada', update vehicle status
      const newStatus = updateData.status;
      if (newStatus && (newStatus === 'finalizada' || newStatus === 'cancelada')) {
        const { error: vehicleUpdateError } = await supabase
          .from('veiculos')
          .update({ status: 'disponivel' })
          .eq('id', currentLocacao.veiculo_id);
          
        if (vehicleUpdateError) {
            console.error('Erro ao atualizar status do veículo:', vehicleUpdateError);
            // Log the error, but don't block the response
        }
      }

      return response.status(200).json({ success: true, data: updatedLocacao });
    }

    if (method === 'DELETE') {
      console.log('=== INICIANDO DELETE DE LOCAÇÃO ===');
      console.log('ID da locação:', id);
      
      if (!id) return response.status(400).json({ success: false, error: 'Missing ID' });
      
      // Buscar dados da locação antes de deletar
      const { data: locacao, error: locacaoError } = await supabase.from('locacoes').select('veiculo_id').eq('id', id).single();
      console.log('Dados da locação encontrada:', locacao);
      console.log('Erro ao buscar locação:', locacaoError);
      
      if (locacaoError) {
        console.error('Erro ao buscar locação para deletar:', locacaoError);
        throw locacaoError;
      }

      // PRIMEIRO: Deletar vistorias relacionadas
      console.log('Deletando vistorias da locação:', id);
      const { error: vistoriasDeleteError } = await supabase
        .from('vistorias')
        .delete()
        .eq('locacao_id', id);
      
      console.log('Erro ao deletar vistorias:', vistoriasDeleteError);
      
      if (vistoriasDeleteError) {
        console.error('Erro ao deletar vistorias:', vistoriasDeleteError);
        throw vistoriasDeleteError;
      }

      // SEGUNDO: Deletar movimentações financeiras relacionadas
      console.log('Deletando movimentações financeiras da locação:', id);
      const { error: movimentacoesDeleteError } = await supabase
        .from('movimentacoes_financeiras')
        .delete()
        .eq('locacao_id', id);
      
      console.log('Erro ao deletar movimentações financeiras:', movimentacoesDeleteError);
      
      if (movimentacoesDeleteError) {
        console.error('Erro ao deletar movimentações financeiras:', movimentacoesDeleteError);
        throw movimentacoesDeleteError;
      }

      // TERCEIRO: Deletar a locação
      console.log('Deletando a locação:', id);
      const { error: deleteError } = await supabase.from('locacoes').delete().eq('id', id);
      console.log('Erro ao deletar locação:', deleteError);
      
      if (deleteError) {
        console.error('Erro ao deletar locação:', deleteError);
        throw deleteError;
      }

      // QUARTO: Atualizar status do veículo
      console.log('Atualizando status do veículo para disponível:', locacao.veiculo_id);
      const { error: vehicleUpdateError } = await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locacao.veiculo_id);
      console.log('Erro ao atualizar veículo:', vehicleUpdateError);
      
      if (vehicleUpdateError) {
        console.error('Erro ao atualizar status do veículo após deletar locação:', vehicleUpdateError);
        // Não bloqueia a resposta, mas loga o erro
      }

      console.log('Locação, vistorias e movimentações financeiras deletadas com sucesso');
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função locações [id]:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}