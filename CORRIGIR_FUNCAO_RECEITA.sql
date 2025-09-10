-- =====================================================
-- CORREÇÃO DEFINITIVA PARA SEARCH_PATH da função get_receita_mes
-- =====================================================
-- Este script apaga a função e a recria para garantir
-- que a versão correta e segura seja aplicada.

-- Passo 1: Apagar a função existente. Ignora o erro se ela não existir.
DROP FUNCTION IF EXISTS public.get_receita_mes(DATE);

-- Passo 2: Recriar a função com o search_path seguro.
CREATE OR REPLACE FUNCTION public.get_receita_mes(mes_ano DATE)
RETURNS DECIMAL
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(SUM(valor), 0)
    FROM public.movimentacoes_financeiras
    WHERE tipo = 'entrada'
    AND DATE_TRUNC('month', data_movimentacao) = DATE_TRUNC('month', mes_ano);
$$;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
-- 1. Copie e cole todo o conteúdo deste arquivo no
--    SQL Editor do seu projeto Supabase.
-- 2. Clique em "RUN".
-- =====================================================
