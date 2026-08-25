import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardStats } from '@/shared/types';
import { reconnectSupabaseAuth, supabase } from '@/react-app/supabase';
import { getTodayLocalString, getFirstDayOfMonthLocalString } from '@/react-app/utils/formatters';

interface UseApiOptions {
  immediate?: boolean;
}

// Helper com timeout para evitar travamentos em conexões móveis
const withTimeout = <T>(promise: Promise<T>, ms: number = 9000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite excedido na consulta')), ms)
    )
  ]);
};

// Executa a função com tentativas automáticas (backoff exponencial).
// Resolve a perda de conexão ao trocar de rede ou após inatividade:
// se falhar na primeira vez, renova a sessão persistida e tenta de novo.
const withRetry = async <T>(fn: () => Promise<T>, attempts = 2): Promise<T> => {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || '').toLowerCase();
      const isNetwork =
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('timeout') ||
        msg.includes('jwt') ||
        msg.includes('unauthorized') ||
        msg.includes('tempo limite') ||
        msg.includes('failed to fetch');
      if (!isNetwork || i === attempts - 1) break;

      // A renovação é serializada: evita reutilizar um refresh token em paralelo.
      if (i === 0) {
        await reconnectSupabaseAuth();
      }

      // Espera curta entre tentativas
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
};

// Garantir que a sessão JWT está ativa, válida e não expirada
async function ensureSession(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    const expiresSoon = session?.expires_at && (session.expires_at * 1000) < (Date.now() + 60_000);
    if (expiresSoon && typeof navigator !== 'undefined' && navigator.onLine) {
      await reconnectSupabaseAuth();
    }
  } catch {
    // Não derruba a query: o withRetry do executeSupabaseQuery cuidará da reconexão
  }
}

// Handler direto e seguro do Supabase com validação e integridade
async function executeSupabaseQuery(url: string): Promise<any> {
  // Garantir sessão ativa antes de qualquer query
  await ensureSession();

  const cleanUrl = url.split('?')[0];
  const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');

  // 1. Dashboard Básico e Avançado
  if (cleanUrl.includes('/api/dashboard')) {
    const tipo = params.get('tipo');

    if (tipo === 'stats') {
      try {
        const { data: veiculosLocacoes } = await withTimeout(
          supabase
            .from('locacoes')
            .select('veiculo_id, valor_total, veiculos(id, marca, modelo, ano, placa)')
            .not('veiculos', 'is', null)
        );

        const veiculosStats: Record<string, any> = {};
        (veiculosLocacoes || []).forEach((loc: any) => {
          if (loc.veiculos) {
            const vId = loc.veiculo_id;
            if (!veiculosStats[vId]) {
              veiculosStats[vId] = { veiculo: loc.veiculos, totalLocacoes: 0, totalLucro: 0 };
            }
            veiculosStats[vId].totalLocacoes += 1;
            veiculosStats[vId].totalLucro += Number(loc.valor_total || 0);
          }
        });

        const arr = Object.values(veiculosStats);
        const veiculosMaisLocados = [...arr].sort((a, b) => b.totalLocacoes - a.totalLocacoes).slice(0, 5);
        const veiculosMaiorLucro = [...arr].sort((a, b) => b.totalLucro - a.totalLucro).slice(0, 5);

        const { data: movs } = await withTimeout(
          supabase
            .from('movimentacoes_financeiras')
            .select('tipo, valor, data_movimentacao')
            .eq('tipo', 'entrada')
            .order('data_movimentacao', { ascending: true })
        );

        const receitaPorMes: Record<string, number> = {};
        (movs || []).forEach((m: any) => {
          const d = new Date(m.data_movimentacao || new Date());
          const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          receitaPorMes[chave] = (receitaPorMes[chave] || 0) + Number(m.valor || 0);
        });

        const receitaMensal = Object.entries(receitaPorMes)
          .map(([mes, valor]) => ({ mes, valor }))
          .sort((a, b) => a.mes.localeCompare(b.mes));

        return { veiculosMaisLocados, veiculosMaiorLucro, receitaMensal };
      } catch (e) {
        console.warn('Erro ao carregar estatísticas avançadas:', e);
        return { veiculosMaisLocados: [], veiculosMaiorLucro: [], receitaMensal: [] };
      }
    }

    // Dashboard Básico super otimizado com Promise.allSettled
    try {
      const hoje = getTodayLocalString();
      const primeiroDiaMes = getFirstDayOfMonthLocalString();

      const [locacoesRes, veiculosRes, movsRes, manutRes] = await Promise.allSettled([
        withTimeout(supabase.from('locacoes').select('status, data_entrega'), 15000),
        withTimeout(supabase.from('veiculos').select('status'), 15000),
        withTimeout(supabase.from('movimentacoes_financeiras').select('tipo, valor, categoria, data_movimentacao'), 15000),
        withTimeout(supabase.from('manutencoes').select('valor'), 15000)
      ]);

      const locacoes = locacoesRes.status === 'fulfilled' ? (locacoesRes.value.data || []) : [];
      const veiculos = veiculosRes.status === 'fulfilled' ? (veiculosRes.value.data || []) : [];
      const movs = movsRes.status === 'fulfilled' ? (movsRes.value.data || []) : [];
      const manutencoes = manutRes.status === 'fulfilled' ? (manutRes.value.data || []) : [];

      const activeRentals = locacoes.filter((l: any) => l.status === 'ativa').length;
      const expiredRentals = locacoes.filter((l: any) => l.status === 'ativa' && l.data_entrega && l.data_entrega < hoje).length;
      const availableVehicles = veiculos.filter((v: any) => v.status === 'disponivel').length;
      const rentedVehicles = veiculos.filter((v: any) => v.status === 'locado').length;

      const totalRevenue = movs
        .filter((m: any) => m.tipo === 'entrada' && (m.data_movimentacao || '') >= primeiroDiaMes)
        .reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);

      const receitaSeguro = movs
        .filter((m: any) => m.tipo === 'entrada' && m.categoria === 'seguro' && (m.data_movimentacao || '') >= primeiroDiaMes)
        .reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);

      const totalEntradas = movs
        .filter((m: any) => m.tipo === 'entrada')
        .reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);

      const totalSaidas = movs
        .filter((m: any) => m.tipo === 'saida')
        .reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);

      const totalManut = manutencoes.reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);

      const stats: DashboardStats = {
        locacoesAtivas: activeRentals,
        veiculosDisponiveis: availableVehicles,
        veiculosLocados: rentedVehicles,
        receitaMes: totalRevenue,
        receitaSeguro: receitaSeguro,
        saldoCaixa: (totalEntradas - totalSaidas) - totalManut,
        locacoesVencidas: expiredRentals
      };

      return stats;
    } catch (e) {
      console.warn('Erro ao carregar métricas do dashboard:', e);
      return {
        locacoesAtivas: 0,
        veiculosDisponiveis: 0,
        veiculosLocados: 0,
        receitaMes: 0,
        receitaSeguro: 0,
        saldoCaixa: 0,
        locacoesVencidas: 0
      };
    }
  }

  // 2. Veículos (com suporte a filtro de status)
  if (cleanUrl.includes('/api/veiculos')) {
    const status = params.get('status');
    let query = supabase.from('veiculos').select('*').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await withTimeout(query);
    if (error) {
      console.warn('Erro ao buscar veículos:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  // 3. Locações
  if (cleanUrl.includes('/api/locacoes')) {
    const { data, error } = await withTimeout(supabase.from('locacoes').select('*, veiculos(*), clientes(*)').order('created_at', { ascending: false }));
    if (error) {
      console.warn('Erro ao buscar locações:', error);
      throw new Error(error.message);
    }
    const mapped = (data || []).map((loc: any) => ({
      ...loc,
      cliente_nome: loc.cliente_nome || loc.clientes?.nome || 'Cliente não informado',
      veiculo_info: loc.veiculo_info || (loc.veiculos ? `${loc.veiculos.marca || ''} ${loc.veiculos.modelo || ''} - ${loc.veiculos.placa || ''}`.trim() : 'Veículo não informado')
    }));
    return mapped;
  }

  // 4. Clientes (Busca por nome, documento/cpf, celular e email com mapeamento perfeito)
  if (cleanUrl.includes('/api/clientes')) {
    const search = params.get('search');
    let query = supabase.from('clientes').select('*').order('nome', { ascending: true });
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`nome.ilike.%${term}%,documento.ilike.%${term}%,celular.ilike.%${term}%,email.ilike.%${term}%`);
    }
    const { data, error } = await withTimeout(query);
    if (error) {
      console.warn('Erro ao buscar clientes:', error);
      throw new Error(error.message);
    }
    const mapped = (data || []).map((c: any) => ({
      ...c,
      cpf_cnpj: c.cpf_cnpj || c.documento || '',
      tipo_pessoa: c.tipo_pessoa || (c.tipo_documento === 'CNPJ' ? 'pj' : 'pf')
    }));
    return mapped;
  }

  // 5. Configurações
  if (cleanUrl.includes('/api/configuracoes')) {
    const { data, error } = await withTimeout(supabase.from('configuracoes_empresa').select('*').limit(1).single());
    if (error) {
      console.warn('Erro ao carregar configurações:', error);
      return null;
    }
    return data || null;
  }

  // 6. Solicitações de Reserva
  if (cleanUrl.includes('/api/solicitacoes_reserva')) {
    const { data, error } = await withTimeout(supabase.from('solicitacoes_reserva').select('*, veiculos(*)').order('created_at', { ascending: false }));
    if (error) {
      console.warn('Erro ao buscar solicitações de reserva:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  // 7. Manutenções
  if (cleanUrl.includes('/api/manutencoes')) {
    const { data, error } = await withTimeout(supabase.from('manutencoes').select('*, veiculos(*)').order('created_at', { ascending: false }));
    if (error) {
      console.warn('Erro ao buscar manutenções:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  // 8. Movimentações Financeiras
  if (cleanUrl.includes('/api/movimentacoes_financeiras')) {
    const { data, error } = await withTimeout(supabase.from('movimentacoes_financeiras').select('*').order('data_movimentacao', { ascending: false }));
    if (error) {
      console.warn('Erro ao buscar movimentações financeiras:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  // 9. Vistorias / Check List
  if (cleanUrl.includes('/api/vistorias')) {
    const { data, error } = await withTimeout(supabase.from('vistorias').select('*, veiculos(*), clientes(*), locacoes(*)').order('created_at', { ascending: false }));
    if (error) {
      console.warn('Erro ao buscar vistorias:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  return [];
}

// Cache de dados no localStorage para exibir imediatamente ao navegar
const CACHE_PREFIX = 'oliveira_cache_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCachedData<T>(url: string): T | null {
  try {
    const key = CACHE_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null; // expirado

    // Se for dashboard e tiver tudo zerado, descarta do cache
    if (url.includes('/api/dashboard') && data && typeof data === 'object') {
      const d = data as any;
      if (d.locacoesAtivas === 0 && d.veiculosDisponiveis === 0 && d.saldoCaixa === 0 && d.receitaMes === 0) {
        return null;
      }
    }

    return data as T;
  } catch {
    return null;
  }
}

function setCachedData<T>(url: string, data: T): void {
  try {
    if (!data) return;
    // Não salvar estatísticas zeradas
    if (url.includes('/api/dashboard') && typeof data === 'object') {
      const d = data as any;
      if (d.locacoesAtivas === 0 && d.veiculosDisponiveis === 0 && d.saldoCaixa === 0 && d.receitaMes === 0) {
        return;
      }
    }
    const key = CACHE_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* no-op: cache indisponivel */ }
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = { immediate: true }
) {
  // Carregar cache imediatamente para não mostrar zeros ao navegar
  const cached = getCachedData<T>(url);
  const [data, setData] = useState<T | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => executeSupabaseQuery(url));
      setData(result);
      // Salvar no cache após sucesso
      setCachedData(url, result);
    } catch (err: any) {
      console.error(`Erro ao carregar dados de ${url}:`, err);
      // Manter dados em cache ao invés de zerar
      const fallback = getCachedData<T>(url);
      if (fallback) {
        setData(fallback);
      } else {
        setError(err?.message || 'Erro de conexão com o banco de dados');
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.immediate) execute();
    return () => { try { abortRef.current?.abort(); } catch { /* no-op */ } };
  }, [execute, options.immediate]);

  // Reconexão automática: quando o usuário troca de rede (Wi-Fi → 4G, por
  // exemplo) e a internet volta, refaz a consulta sem precisar recarregar.
  useEffect(() => {
    let reconnecting = false;
    const refetchOnReconnect = () => {
      if (reconnecting) return;
      reconnecting = true;
      // Pequena pausa para a rede estabilizar após o evento "online"
      setTimeout(() => {
        execute();
        reconnecting = false;
      }, 500);
    };

    window.addEventListener('online', refetchOnReconnect);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetchOnReconnect();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('online', refetchOnReconnect);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useMutation<TData, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string,
    variables: TVariables,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  ): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    try {
      const cleanUrl = url.split('?')[0];

      // Mutação para Veículos
      if (cleanUrl.includes('/api/veiculos')) {
        if (method === 'POST') {
          const { data, error } = await supabase.from('veiculos').insert([variables as any]).select().single();
          if (error) throw error;
          return data as any;
        } else if (method === 'PUT') {
          const id = (variables as any)?.id || url.split('/').pop();
          const { data, error } = await supabase.from('veiculos').update(variables as any).eq('id', id).select().single();
          if (error) throw error;
          return data as any;
        } else if (method === 'DELETE') {
          const id = (variables as any)?.id || url.split('/').pop();
          const { data, error } = await supabase.from('veiculos').delete().eq('id', id);
          if (error) throw error;
          return data as any;
        }
      }

      // Mutação para Clientes
      if (cleanUrl.includes('/api/clientes')) {
        const clientPayload = {
          ...(variables as any),
          documento: (variables as any)?.cpf_cnpj || (variables as any)?.documento || '',
          tipo_documento: (variables as any)?.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF'
        };
        delete clientPayload.cpf_cnpj;
        delete clientPayload.tipo_pessoa;

        if (method === 'POST') {
          const { data, error } = await supabase.from('clientes').insert([clientPayload]).select().single();
          if (error) throw error;
          return { ...data, cpf_cnpj: data.documento } as any;
        } else if (method === 'PUT') {
          const id = (variables as any)?.id || url.split('/').pop();
          const { data, error } = await supabase.from('clientes').update(clientPayload).eq('id', id).select().single();
          if (error) throw error;
          return { ...data, cpf_cnpj: data.documento } as any;
        } else if (method === 'DELETE') {
          const id = (variables as any)?.id || url.split('/').pop();
          const { data, error } = await supabase.from('clientes').delete().eq('id', id);
          if (error) throw error;
          return data as any;
        }
      }

      // Mutação para Locações com Regras de Negócio Completas
      if (cleanUrl.includes('/api/locacoes')) {
        if (method === 'POST') {
          const vars = variables as any;

          // Caminho principal: RPC transacional no banco (overlap + status do
          // veículo + lançamentos financeiros + vistoria inicial em UMA transação).
          // Requer execução do arquivo SUPABASE_SECURITY_RLS.sql no Supabase.
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('criar_locacao', { p: vars });

          if (rpcError) {
            const rpcMsg = String(rpcError.message || '');
            const rpcMissing =
              rpcMsg.includes('Could not find the function') ||
              rpcMsg.includes('schema cache');
            if (!rpcMissing) {
              // Erro real de regra de negócio vindo da RPC (overlap, disponibilidade etc.)
              throw rpcError;
            }
            console.warn('RPC criar_locacao não encontrada no banco; usando fallback local (execute SUPABASE_SECURITY_RLS.sql).');
          } else if (rpcData) {
            return (Array.isArray(rpcData) ? rpcData[0] : rpcData) as any;
          }

          // Fallback local (apenas até o SQL acima ser executado).
          // Mesmas regras de negócio aplicadas no cliente.
          if (vars.veiculo_id && vars.data_locacao && vars.data_entrega) {
            const { data: veiculoOk } = await supabase
              .from('veiculos')
              .select('status')
              .eq('id', vars.veiculo_id)
              .maybeSingle();

            if (!veiculoOk || veiculoOk.status !== 'disponivel') {
              throw new Error('Veículo não está disponível.');
            }

            const { data: conflitos } = await supabase
              .from('locacoes')
              .select('id, data_locacao, data_entrega')
              .eq('veiculo_id', vars.veiculo_id)
              .eq('status', 'ativa')
              .lte('data_locacao', vars.data_entrega)
              .gte('data_entrega', vars.data_locacao);

            if (conflitos && conflitos.length > 0) {
              throw new Error('Este veículo já possui uma locação ativa no período selecionado.');
            }
          }

          // Inserir a locação
          const { data: novaLocacao, error: locErr } = await supabase
            .from('locacoes')
            .insert([vars])
            .select()
            .single();
          if (locErr) throw locErr;

          // Atualizar status do veículo para locado
          if (vars.veiculo_id) {
            const { error: veiculoErr } = await supabase
              .from('veiculos')
              .update({ status: 'locado' })
              .eq('id', vars.veiculo_id);
            if (veiculoErr) throw veiculoErr;
          }

          // Lançamento financeiro automático (não engole erro)
          if (Number(vars.valor_total || 0) > 0) {
            const { error: movErr } = await supabase
              .from('movimentacoes_financeiras')
              .insert([{
                tipo: 'entrada',
                categoria: 'locacao',
                descricao: `Locação #${novaLocacao.id} - ${vars.observacoes || 'Diárias de locação'}`,
                valor: Number(vars.valor_total || 0),
                data_movimentacao: vars.data_locacao || getTodayLocalString(),
                locacao_id: novaLocacao.id,
                cliente_id: vars.cliente_id
              }]);
            if (movErr) throw movErr;
          }

          if (Number(vars.valor_seguro || 0) > 0) {
            const { error: segErr } = await supabase
              .from('movimentacoes_financeiras')
              .insert([{
                tipo: 'entrada',
                categoria: 'seguro',
                descricao: `Recebimento de Seguro - Locação #${novaLocacao.id}`,
                valor: Number(vars.valor_seguro || 0),
                data_movimentacao: vars.data_locacao || getTodayLocalString(),
                locacao_id: novaLocacao.id,
                cliente_id: vars.cliente_id
              }]);
            if (segErr) throw segErr;
          }

          // Vistoria inicial (melhor esforço no fallback; usa as colunas reais da tabela)
          await supabase.from('vistorias').insert([{
            veiculo_id: vars.veiculo_id,
            locacao_id: novaLocacao.id,
            cliente_id: vars.cliente_id,
            tipo_vistoria: 'saida',
            placa: 'N/D',
            modelo: 'N/D',
            cor: 'N/D',
            quilometragem: 0,
            nivel_combustivel: 'cheio',
            nome_vistoriador: 'Sistema',
            observacoes: 'Vistoria inicial de entrega gerada automaticamente.',
            data_vistoria: new Date().toISOString()
          }]).catch(e => console.warn('Aviso na vistoria inicial:', e));

          return novaLocacao as any;
        } else if (method === 'PUT') {
          const id = (variables as any)?.id || url.split('/').pop();
          const vars = { ...(variables as any), id: parseInt(id, 10) };

          const { data: rpcData, error: rpcError } = await supabase
            .rpc('atualizar_locacao', { p: vars });

          if (rpcError) {
            const rpcMsg = String(rpcError.message || '');
            const rpcMissing =
              rpcMsg.includes('Could not find the function') ||
              rpcMsg.includes('schema cache');
            if (!rpcMissing) {
              throw rpcError;
            }
            console.warn('RPC atualizar_locacao não encontrada; usando fallback local.');
          } else if (rpcData) {
            return (Array.isArray(rpcData) ? rpcData[0] : rpcData) as any;
          }

          // Fallback local
          const { data: locAtualizada, error } = await supabase.from('locacoes').update(vars).eq('id', id).select().single();
          if (error) throw error;

          // Se a locação foi finalizada ou cancelada, liberar o veículo
          if (vars.status === 'finalizada' || vars.status === 'cancelada') {
            if (vars.veiculo_id) {
              await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', vars.veiculo_id);
            }
          }

          return locAtualizada as any;
        } else if (method === 'DELETE') {
          const id = parseInt((variables as any)?.id || url.split('/').pop(), 10);

          const { error: rpcError } = await supabase
            .rpc('excluir_locacao', { p_id: id });

          if (rpcError) {
            const rpcMsg = String(rpcError.message || '');
            const rpcMissing =
              rpcMsg.includes('Could not find the function') ||
              rpcMsg.includes('schema cache');
            if (!rpcMissing) {
              throw rpcError;
            }
            console.warn('RPC excluir_locacao não encontrada; usando fallback local.');
          } else {
            return { success: true } as any;
          }

          // Fallback local
          const { data: locExistente } = await supabase.from('locacoes').select('veiculo_id').eq('id', id).single();
          if (locExistente?.veiculo_id) {
            await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locExistente.veiculo_id);
          }

          const { data, error } = await supabase.from('locacoes').delete().eq('id', id);
          if (error) throw error;
          return data as any;
        }
      }

      return null;
    } catch (err: any) {
      console.error(`Erro na mutação para ${url}:`, err);
      const msg = err?.message || 'Erro ao salvar alterações no banco de dados';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
