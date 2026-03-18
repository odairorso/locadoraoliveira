import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse } from '@/shared/types';

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = { immediate: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (fetchOptions?: RequestInit) => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...fetchOptions,
      });

      const result: ApiResponse<T> = await response.json();

      if (result.success) {
        if (result.data && typeof result.data === 'object' &&
            Object.keys(result).some(key => key !== 'success' && key !== 'data' && key !== 'error')) {
          setData(result as any);
        } else {
          setData(result.data || null);
        }
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.immediate) execute();
    return () => { try { abortRef.current?.abort(); } catch {} };
  }, [execute, options.immediate]);

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
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      });

      const result: ApiResponse<TData> = await response.json();

      if (result.success) {
        return result.data !== undefined ? result.data : true as any;
      } else {
        setError(result.error || 'Erro desconhecido');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
