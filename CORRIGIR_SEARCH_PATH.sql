-- =====================================================
-- CORREÇÃO DE SEGURANÇA PARA SEARCH_PATH DE FUNÇÕES
-- =====================================================
-- Este script corrige o aviso de "mutable search_path"
-- para as funções listadas.

-- Corrigir a função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corrigir a função get_receita_mes
-- (Mesmo que o arquivo pareça correto, executamos novamente para garantir
-- que a versão no banco de dados seja a correta)
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
-- 3. Depois, vá no Security Advisor do Supabase e
--    verifique se os avisos desapareceram.
-- =====================================================
