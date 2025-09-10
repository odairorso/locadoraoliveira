-- =====================================================
-- REMOÇÃO DEFINITIVA DA FUNÇÃO ANTIGA
-- =====================================================
-- Este script remove a função 'get_receita_mes' com o 
-- argumento 'text' que está causando o aviso de segurança.

DROP FUNCTION IF EXISTS public.get_receita_mes(text);
