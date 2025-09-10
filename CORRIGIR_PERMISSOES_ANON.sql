-- ========================================================
-- SCRIPT PARA CORRIGIR PERMISSÕES DO USUÁRIO ANÔNIMO (anon)
-- ========================================================
-- Este script concede as permissões necessárias para que a API
-- pública consiga ler os dados do banco de dados após a
-- ativação do Row Level Security (RLS).

-- Conceder permissão de uso no schema 'public' para o usuário 'anon'
-- Isso permite que o usuário 'anon' "veja" os objetos dentro do schema.
GRANT USAGE ON SCHEMA public TO anon;

-- Conceder permissão de SELECT em TODAS as tabelas no schema 'public' para o usuário 'anon'
-- Isso permite que a API leia os dados das tabelas (locacoes, veiculos, etc.).
-- A segurança de quais LINHAS podem ser lidas ainda é controlada pelas políticas RLS.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Conceder permissão para EXECUTAR TODAS as funções no schema 'public' para o usuário 'anon'
-- Isso é crucial para que a API possa chamar as funções como 'get_saldo_caixa' e 'get_receita_mes'.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ========================================================
-- INSTRUÇÕES
-- ========================================================
-- 1. Acesse o Supabase Dashboard.
-- 2. Vá em "SQL Editor".
-- 3. Cole este script completo e execute.
-- 4. Após executar, faça o "Redeploy" na Vercel novamente
--    para limpar o cache da API.
-- ========================================================
