import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Rotina de finalização automática de locações vencidas.
//
// SEGURANÇA (obrigatório antes de usar em produção):
//   Este endpoint é publicamente alcançável em <projeto>.vercel.app.
//   Ele está protegido por um segredo (CRON_SECRET) e NUNCA deve ser chamado
//   sem autenticação. Configuração no Vercel:
//     1. Crie a env var CRON_SECRET com um valor aleatório longo (ex.:
//        `openssl rand -hex 32`).
//     2. No vercel.json, adicione o segredo à URL do cron:
//        "path": "/api/cron/finalize-locacoes?secret=<SEU_CRON_SECRET>"
//        (o Vercel envia a query string exatamente como configurada)
//     3. Garanta que SUPABASE_SERVICE_ROLE_KEY esteja configurada no Vercel
//        (a chave service role do projeto Supabase).
// ---------------------------------------------------------------------------

// "Hoje" no fuso horário do negócio (America/Campo_Grande = Mato Grosso do Sul, UTC-4)
function getTodayLocal() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Campo_Grande' });
  } catch {
    // Fallback: fuso local do servidor (melhor que nada, mas prefira a env TZ=America/Campo_Grande)
    return new Date().toISOString().split('T')[0];
  }
}

function isAuthorized(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: false, status: 503, message: 'CRON_SECRET não configurada no ambiente.' };
  }

  const url = new URL(request.url, `http://${request.headers?.host || 'localhost'}`);
  const querySecret = url.searchParams.get('secret') || '';
  const headerSecret = (request.headers?.authorization || request.headers?.Authorization || '')
    .replace(/^Bearer\s+/i, '');

  const provided = querySecret || headerSecret;
  if (provided !== expected) {
    return { ok: false, status: 401, message: 'Não autorizado.' };
  }

  const isVercelCron = request.headers?.['x-vercel-cron'] === '1';
  if (!isVercelCron) {
    // Permite invocação manual com o segredo (ex.: teste), mas registra o aviso.
    console.warn('[cron] Invoação manual com CRON_SECRET (fora do agendamento Vercel).');
  }

  return { ok: true };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  const auth = isAuthorized(request);
  if (!auth.ok) {
    return response.status(auth.status).json({ error: auth.message });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // Nome correto da chave service role (SUPABASE_SERVICE_KEY era o nome antigo/errado)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return response.status(500).json({ error: "Variáveis de ambiente do Supabase não configuradas." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Data de hoje no fuso local do negócio (antes usava UTC via toISOString)
    const hoje = getTodayLocal();

    const { data: locacoesFinalizadas, error, count } = await supabase
      .from('locacoes')
      .update({
        status: 'finalizada',
        updated_at: new Date().toISOString()
      })
      .lt('data_entrega', hoje) // lt = less than (menor que hoje)
      .eq('status', 'ativa')
      .select('veiculo_id');

    if (error) {
      console.error('Erro ao finalizar locações:', error);
      throw error;
    }

    let veiculosAtualizadosCount = 0;
    if (locacoesFinalizadas && locacoesFinalizadas.length > 0) {
      const veiculoIds = [...new Set(locacoesFinalizadas.map(l => l.veiculo_id))];

      const { error: veiculoError } = await supabase
        .from('veiculos')
        .update({ status: 'disponivel' })
        .in('id', veiculoIds);

      if (veiculoError) {
        console.error('Erro ao atualizar status dos veículos:', veiculoError);
      } else {
        veiculosAtualizadosCount = veiculoIds.length;
      }
    }

    response.status(200).json({
      message: `Rotina executada. ${count || 0} locações finalizadas. ${veiculosAtualizadosCount} veículos atualizados para disponível.`,
      locacoesFinalizadas: count || 0,
      veiculosAtualizados: veiculosAtualizadosCount
    });

  } catch (error) {
    console.error("Erro na rotina de finalização:", error);
    // Não vazar detalhes internos (error.message) para o chamador
    response.status(500).json({
      error: "Erro interno do servidor ao executar a rotina."
    });
  }
}
