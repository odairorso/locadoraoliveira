-- =====================================================================
-- HARDENING RLS — COMPLEMENTO (execute DEPOIS do SUPABASE_SECURITY_RLS.sql)
-- =====================================================================
-- O script principal de segurança é o SUPABASE_SECURITY_RLS.sql (idempotente,
-- habilita RLS, cria políticas por papel e as RPCs transacionais). Este
-- arquivo complementa com proteções adicionais recomendadas na auditoria:
--
--   1. Impede que um usuário final altere o próprio `role` na tabela perfis
--      (defesa em profundidade: mesmo se uma policy permitir UPDATE na própria
--      linha, o trigger garante que só admin/um RPC consegue mudar `role`).
--   2. Remove policies antigas "abertas" que possam ter sobrado de scripts
--      anteriores (ex.: manutencoes FOR ALL USING (true)).
--   3. Cria uma VIEW pública de catálogo SEM o RENAVAM (documento do veículo),
--      para uso opcional na página pública.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Trigger que impede usuário final de se promover (alterar role)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verificar_role_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a linha que está sendo gravada tiver role diferente de 'cliente',
  -- exige que o autor da operação seja admin. (Cadastro de cliente pode
  -- continuar inserindo role = 'cliente'.)
  IF NEW.role IS DISTINCT FROM 'cliente' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem definir o cargo do perfil.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verificar_role_perfil ON public.perfis;
CREATE TRIGGER trg_verificar_role_perfil
  BEFORE INSERT OR UPDATE OF role ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.verificar_role_perfil();

-- ---------------------------------------------------------------------
-- 2. Garantir que não há policy "aberta" (USING (true)) nas tabelas
--    operacionais (remove as criadas por scripts antigos).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('manutencoes','vistorias','locacoes','clientes',
                        'movimentacoes_financeiras','perfis')
      AND (qual IS NULL OR qual = 'true')
      AND (with_check IS NULL OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. (Opcional) View pública de catálogo sem RENAVAM.
--    Se a página pública usar esta view em vez de `veiculos`, o visitante
--    nunca recebe o renavam. RLS de `veiculos` continua valendo para a view
--    apenas se você também criar policies de SELECT para `veiculos` (a view
--    herda as policies da tabela base quando `security_invoker` é usado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.catalogo_publico
WITH (security_invoker = on) AS
SELECT
  id, marca, modelo, ano, placa, cor,
  valor_diaria, valor_veiculo, tipo_operacao, status,
  foto_principal, fotos, transmissao, combustivel, passageiros,
  tem_ar_condicionado, tem_direcao_hidraulica, tem_vidro_eletrico, descricao
FROM public.veiculos
WHERE status IS DISTINCT FROM 'excluido';

-- ---------------------------------------------------------------------
-- FIM. Verifique com:
--   SELECT * FROM pg_policies WHERE schemaname = 'public';
--   SELECT count(*) FROM vistorias;  -- como usuário anon (deve ser 0/negado)
-- ---------------------------------------------------------------------
