
import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // Secure the endpoint
  if (request.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for elevated privileges

  if (!supabaseUrl || !supabaseKey) {
    console.error('Cron Job Error: Missing Supabase URL or Service Role Key');
    return response.status(500).json({ success: false, error: 'Server configuration error.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log(`Cron Job: Buscando locações ativas com data de entrega anterior a ${today}...`);

    // 1. Find active leases that have expired
    const { data: expiredLocacoes, error: fetchError } = await supabase
      .from('locacoes')
      .select('id, veiculo_id')
      .eq('status', 'ativa')
      .lt('data_entrega', today);

    if (fetchError) {
      console.error('Cron Job Error fetching leases:', fetchError);
      throw fetchError;
    }

    if (!expiredLocacoes || expiredLocacoes.length === 0) {
      console.log('Cron Job: Nenhuma locação expirada encontrada.');
      return response.status(200).json({ success: true, message: 'Nenhuma locação expirada encontrada.' });
    }

    console.log(`Cron Job: ${expiredLocacoes.length} locações expiradas encontradas.`);
    const locacaoIds = expiredLocacoes.map(l => l.id);
    const veiculoIds = expiredLocacoes.map(l => l.veiculo_id);

    // 2. Update status of expired leases to 'finalizada'
    const { error: updateLocacoesError } = await supabase
      .from('locacoes')
      .update({ status: 'finalizada' })
      .in('id', locacaoIds);

    if (updateLocacoesError) {
      console.error('Cron Job Error updating leases:', updateLocacoesError);
      throw updateLocacoesError;
    }

    console.log(`Cron Job: ${locacaoIds.length} locações atualizadas para "finalizada".`);

    // 3. Update status of corresponding vehicles to 'disponivel'
    const { error: updateVeiculosError } = await supabase
      .from('veiculos')
      .update({ status: 'disponivel' })
      .in('id', veiculoIds);

    if (updateVeiculosError) {
      console.error('Cron Job Error updating vehicles:', updateVeiculosError);
      // Even if this fails, the primary goal (updating leases) was met.
      // Log the error but don't throw, to avoid failed cron runs for a secondary issue.
    } else {
      console.log(`Cron Job: ${veiculoIds.length} veículos atualizados para "disponível".`);
    }

    return response.status(200).json({
      success: true,
      message: `Processo finalizado. ${locacaoIds.length} locações finalizadas e ${veiculoIds.length} veículos liberados.`,
    });

  } catch (error) {
    console.error("Erro no Cron Job de finalização de locações:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}
