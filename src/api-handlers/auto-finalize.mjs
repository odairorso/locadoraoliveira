import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function autoFinalizeExpiredRentals() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Auto-Finalize] Supabase URL or Anon Key is missing. Skipping auto-finalize.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Date in YYYY-MM-DD format based on local time
    const hoje = new Date().toLocaleDateString('en-CA'); // en-CA format is YYYY-MM-DD

    // Fetch active rentals that have expired (return date is less than today)
    const { data: locacoesExpiradas, error: fetchError } = await supabase
      .from('locacoes')
      .select('id, veiculo_id')
      .eq('status', 'ativa')
      .lt('data_entrega', hoje);

    if (fetchError) {
      console.error('[Auto-Finalize] Erro ao buscar locações expiradas:', fetchError);
      return;
    }

    if (locacoesExpiradas && locacoesExpiradas.length > 0) {
      console.log(`[Auto-Finalize] Finalizando ${locacoesExpiradas.length} locações expiradas.`);
      
      const idsLocacoes = locacoesExpiradas.map(l => l.id);
      const idsVeiculos = [...new Set(locacoesExpiradas.map(l => l.veiculo_id).filter(id => id != null))];

      // Update rental status to 'finalizada'
      const { error: locacaoError } = await supabase
        .from('locacoes')
        .update({ 
          status: 'finalizada',
          updated_at: new Date().toISOString()
        })
        .in('id', idsLocacoes);

      if (locacaoError) {
        console.error('[Auto-Finalize] Erro ao atualizar status das locações:', locacaoError);
        return;
      }

      // Update vehicle status to 'disponivel'
      if (idsVeiculos.length > 0) {
        const { error: veiculoError } = await supabase
          .from('veiculos')
          .update({ status: 'disponivel' })
          .in('id', idsVeiculos);

        if (veiculoError) {
          console.error('[Auto-Finalize] Erro ao liberar veículos:', veiculoError);
        }
      }

      console.log(`[Auto-Finalize] Sucesso: finalizou locações (${idsLocacoes.join(', ')}) e liberou veículos.`);
    }
  } catch (error) {
    console.error('[Auto-Finalize] Erro na rotina:', error);
  }
}
