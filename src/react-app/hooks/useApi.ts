import { useState, useEffect } from 'react';
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

  const execute = async (fetchOptions?: RequestInit) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...fetchOptions,
      });
      
      const result: ApiResponse<T> = await response.json();
      
      if (result.success) {
        setData(result.data || null);
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const post = async (body: any) => {
    return execute({
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  const put = async (body: any) => {
    return execute({
      method: 'PUT',
      body: JSON.stringify(body),
    });
  };

  const del = async () => {
    return execute({
      method: 'DELETE',
    });
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [url, options.immediate]);

  return {
    data,
    loading,
    error,
    execute,
    post,
    put,
    delete: del,
    refetch: execute,
  };
}

export function useMutation<TData, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string, 
    variables: TVariables, 
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<TData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      });
      
      const result: ApiResponse<TData> = await response.json();
      
      if (result.success) {
        return result.data || null;
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

  return {
    mutate,
    loading,
    error,
  };
}
