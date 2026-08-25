-- ====================================================================
-- SCRIPT DE SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY) - SUPABASE
-- Execute este script INTEIRO no SQL Editor do Supabase.
-- Ele é idempotente: pode ser executado mais de uma vez sem quebrar nada.
--
-- O que ele faz:
--   1. Garante colunas usadas pelo app (valor_seguro, documento, data_vistoria, user_id)
--   2. Ativa RLS em todas as tabelas
--   3. Cria funções auxiliares is_admin() / is_staff() que leem o cargo
--      na tabela perfis (única fonte de verdade de cargo)
--   4. Aplica políticas por papel:
--        - anon: só lê catálogo (veiculos), lê configurações da empresa,
--                envia reserva e se auto-cadastra como cliente
--        - cliente: só o próprio perfil
--        - funcionario/admin: acesso operacional
--        - admin: somente admin gerencia perfis (cargos)
--   5. Cria RPCs transacionais:
--        - public.criar_locacao (overlap + veículo + financeiro + vistoria inicial)
--        - public.atualizar_locacao (troca de veículo + liberação + status)
--        - public.excluir_locacao (liberação atômica de veículo e exclusão)
--   6. Cria RPC segura public.buscar_cliente_publico para o catálogo
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. Garantir colunas que o app usa (idempotente)
-- --------------------------------------------------------------------
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS valor_seguro DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS documento VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(4) DEFAULT 'CPF';
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS data_vistoria TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS user_id UUID;

-- --------------------------------------------------------------------
-- 1. Habilitar RLS em todas as tabelas
-- --------------------------------------------------------------------
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vistorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solicitacoes_reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracoes_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS perfis ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. Remover TODAS as políticas antigas (inclusive as permissivas)
-- --------------------------------------------------------------------
DO $$
DECLARE
  pol record;
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clientes','veiculos','locacoes','movimentacoes_financeiras',
    'vistorias','manutencoes','solicitacoes_reserva',
    'configuracoes_empresa','perfis'
  ] LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- --------------------------------------------------------------------
-- 3. Funções auxiliares de cargo (leem perfis com segurança)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND role = 'admin'
      AND coalesce(ativo, true)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND role IN ('admin', 'funcionario')
      AND coalesce(ativo, true)
  );
$$;

-- --------------------------------------------------------------------
-- 4. Políticas para VEÍCULOS (catálogo público + gestão da equipe)
-- --------------------------------------------------------------------
CREATE POLICY "Veiculos Public Read" ON veiculos
  FOR SELECT
  USING (status != 'excluido' OR status IS NULL);

CREATE POLICY "Veiculos Staff Manage" ON veiculos
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------------------
-- 5. Políticas para CONFIGURAÇÕES DA EMPRESA
-- --------------------------------------------------------------------
CREATE POLICY "Configuracoes Public Read" ON configuracoes_empresa
  FOR SELECT
  USING (true);

CREATE POLICY "Configuracoes Staff Manage" ON configuracoes_empresa
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------------------
-- 6. Políticas para SOLICITAÇÕES DE RESERVA (público envia, equipe gere)
-- --------------------------------------------------------------------
CREATE POLICY "Solicitacoes Public Insert" ON solicitacoes_reserva
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solicitacoes Staff Manage" ON solicitacoes_reserva
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------------------
-- 7. Políticas para CLIENTES
-- --------------------------------------------------------------------
CREATE POLICY "Clientes Public Insert" ON clientes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes Staff Manage" ON clientes
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------------------
-- 8. Políticas para OPERAÇÕES E FINANCEIRO (somente equipe)
-- --------------------------------------------------------------------
CREATE POLICY "Locacoes Staff Manage" ON locacoes
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Vistorias Staff Manage" ON vistorias
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Manutencoes Staff Manage" ON manutencoes
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Movimentacoes Staff Manage" ON movimentacoes_financeiras
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- --------------------------------------------------------------------
-- 9. Políticas para PERFIS (cargos)
-- --------------------------------------------------------------------
CREATE POLICY "Perfis Select Proprio Ou Admin" ON perfis
  FOR SELECT
  TO authenticated
  USING (
    email = lower(auth.jwt() ->> 'email')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Perfis Insert Proprio Cliente" ON perfis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = lower(auth.jwt() ->> 'email')
    AND role = 'cliente'
  );

CREATE POLICY "Perfis Admin Manage" ON perfis
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 10. RPC transacional de CRIAÇÃO de locação
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.criar_locacao(p jsonb)
RETURNS public.locacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_veiculo_id integer;
  v_cliente_id integer;
  v_data_locacao date;
  v_data_entrega date;
  v_status_veiculo text;
  v_overlap integer;
  v_locacao public.locacoes;
  v_placa text;
  v_modelo text;
  v_cor text;
  v_condutor text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado: apenas a equipe pode criar locações.';
  END IF;

  v_veiculo_id := (p->>'veiculo_id')::integer;
  v_cliente_id := (p->>'cliente_id')::integer;
  v_data_locacao := (p->>'data_locacao')::date;
  v_data_entrega := (p->>'data_entrega')::date;

  IF v_veiculo_id IS NULL OR v_cliente_id IS NULL
     OR v_data_locacao IS NULL OR v_data_entrega IS NULL THEN
    RAISE EXCEPTION 'veiculo_id, cliente_id, data_locacao e data_entrega são obrigatórios.';
  END IF;

  IF v_data_entrega < v_data_locacao THEN
    RAISE EXCEPTION 'data_entrega não pode ser anterior a data_locacao.';
  END IF;

  -- Trava o registro do veículo enquanto valida
  SELECT status INTO v_status_veiculo
  FROM public.veiculos
  WHERE id = v_veiculo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado.';
  END IF;

  IF v_status_veiculo IS DISTINCT FROM 'disponivel' THEN
    RAISE EXCEPTION 'Veículo não está disponível.';
  END IF;

  -- Overlap check
  SELECT id INTO v_overlap
  FROM public.locacoes
  WHERE veiculo_id = v_veiculo_id
    AND status = 'ativa'
    AND data_locacao <= v_data_entrega
    AND data_entrega >= v_data_locacao
  LIMIT 1;

  IF v_overlap IS NOT NULL THEN
    RAISE EXCEPTION 'Veículo já possui locação no período informado.';
  END IF;

  INSERT INTO public.locacoes (
    cliente_id, veiculo_id, data_locacao, data_entrega,
    valor_diaria, valor_total, valor_caucao, valor_seguro,
    status, observacoes
  )
  VALUES (
    v_cliente_id,
    v_veiculo_id,
    v_data_locacao,
    v_data_entrega,
    coalesce((p->>'valor_diaria')::numeric, 0),
    coalesce((p->>'valor_total')::numeric, 0),
    coalesce((p->>'valor_caucao')::numeric, 0),
    coalesce((p->>'valor_seguro')::numeric, 0),
    coalesce(p->>'status', 'ativa'),
    p->>'observacoes'
  )
  RETURNING * INTO v_locacao;

  -- Atualiza veículo para locado
  UPDATE public.veiculos
  SET status = 'locado'
  WHERE id = v_veiculo_id;

  -- Lançamento financeiro da locação
  IF coalesce(v_locacao.valor_total, 0) > 0 THEN
    INSERT INTO public.movimentacoes_financeiras (
      tipo, categoria, descricao, valor, data_movimentacao, locacao_id, cliente_id
    )
    VALUES (
      'entrada', 'locacao',
      'Recebimento da Locação #' || v_locacao.id,
      v_locacao.valor_total,
      v_data_locacao,
      v_locacao.id,
      v_cliente_id
    );
  END IF;

  -- Lançamento financeiro do seguro, se houver
  IF coalesce(v_locacao.valor_seguro, 0) > 0 THEN
    INSERT INTO public.movimentacoes_financeiras (
      tipo, categoria, descricao, valor, data_movimentacao, locacao_id, cliente_id
    )
    VALUES (
      'entrada', 'seguro',
      'Recebimento de Seguro - Locação #' || v_locacao.id,
      v_locacao.valor_seguro,
      v_data_locacao,
      v_locacao.id,
      v_cliente_id
    );
  END IF;

  -- Vistoria inicial
  SELECT placa,
         coalesce(marca || ' ', '') || modelo,
         cor
    INTO v_placa, v_modelo, v_cor
  FROM public.veiculos
  WHERE id = v_veiculo_id;

  SELECT nome INTO v_condutor
  FROM public.clientes
  WHERE id = v_cliente_id;

  INSERT INTO public.vistorias (
    veiculo_id, cliente_id, locacao_id, tipo_vistoria,
    placa, modelo, cor, quilometragem, nivel_combustivel,
    nome_condutor, nome_vistoriador, observacoes, data_vistoria
  )
  VALUES (
    v_veiculo_id, v_cliente_id, v_locacao.id, 'saida',
    coalesce(v_placa, 'N/D'), coalesce(v_modelo, 'N/D'), coalesce(v_cor, 'N/D'),
    0, 'cheio',
    coalesce(v_condutor, ''),
    'Sistema',
    'Vistoria inicial criada automaticamente para a locação #' || v_locacao.id,
    now()
  );

  RETURN v_locacao;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_locacao(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_locacao(jsonb) TO authenticated;

-- --------------------------------------------------------------------
-- 11. RPC transacional de ATUALIZAÇÃO de locação
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atualizar_locacao(p jsonb)
RETURNS public.locacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id integer;
  v_locacao_antiga public.locacoes;
  v_locacao_nova public.locacoes;
  v_novo_veiculo_id integer;
  v_novo_status text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado: apenas a equipe pode alterar locações.';
  END IF;

  v_id := (p->>'id')::integer;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'id da locação é obrigatório.';
  END IF;

  SELECT * INTO v_locacao_antiga
  FROM public.locacoes
  WHERE id = v_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locação não encontrada.';
  END IF;

  v_novo_veiculo_id := coalesce((p->>'veiculo_id')::integer, v_locacao_antiga.veiculo_id);
  v_novo_status := coalesce(p->>'status', v_locacao_antiga.status);

  -- Se trocou de veículo
  IF v_novo_veiculo_id != v_locacao_antiga.veiculo_id THEN
    UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_locacao_antiga.veiculo_id;
    IF v_novo_status = 'ativa' THEN
      UPDATE public.veiculos SET status = 'locado' WHERE id = v_novo_veiculo_id;
    END IF;
  ELSE
    -- Se mudou o status da locação
    IF v_novo_status IN ('finalizada', 'cancelada') THEN
      UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_novo_veiculo_id;
    ELSIF v_novo_status = 'ativa' THEN
      UPDATE public.veiculos SET status = 'locado' WHERE id = v_novo_veiculo_id;
    END IF;
  END IF;

  -- Atualiza o registro da locação
  UPDATE public.locacoes
  SET
    veiculo_id = v_novo_veiculo_id,
    cliente_id = coalesce((p->>'cliente_id')::integer, v_locacao_antiga.cliente_id),
    data_locacao = coalesce((p->>'data_locacao')::date, v_locacao_antiga.data_locacao),
    data_entrega = coalesce((p->>'data_entrega')::date, v_locacao_antiga.data_entrega),
    valor_diaria = coalesce((p->>'valor_diaria')::numeric, v_locacao_antiga.valor_diaria),
    valor_total = coalesce((p->>'valor_total')::numeric, v_locacao_antiga.valor_total),
    valor_caucao = coalesce((p->>'valor_caucao')::numeric, v_locacao_antiga.valor_caucao),
    valor_seguro = coalesce((p->>'valor_seguro')::numeric, v_locacao_antiga.valor_seguro),
    status = v_novo_status,
    observacoes = coalesce(p->>'observacoes', v_locacao_antiga.observacoes)
  WHERE id = v_id
  RETURNING * INTO v_locacao_nova;

  RETURN v_locacao_nova;
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_locacao(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_locacao(jsonb) TO authenticated;

-- --------------------------------------------------------------------
-- 12. RPC transacional de EXCLUSÃO de locação
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.excluir_locacao(p_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_veiculo_id integer;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado: apenas a equipe pode excluir locações.';
  END IF;

  SELECT veiculo_id INTO v_veiculo_id
  FROM public.locacoes
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locação não encontrada.';
  END IF;

  -- Libera o veículo
  IF v_veiculo_id IS NOT NULL THEN
    UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_veiculo_id;
  END IF;

  -- Exclui a locação
  DELETE FROM public.locacoes WHERE id = p_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.excluir_locacao(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_locacao(integer) TO authenticated;

-- --------------------------------------------------------------------
-- 13. Remover função pública de consulta de clientes (proteção de dados)
-- --------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.buscar_cliente_publico(text);


-- --------------------------------------------------------------------
-- 14. Índice para acelerar a checagem de overlap
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_locacoes_overlap
  ON locacoes (veiculo_id, status, data_locacao, data_entrega);

-- --------------------------------------------------------------------
-- 15. Garantir perfis de admin
-- --------------------------------------------------------------------
INSERT INTO perfis (email, nome, telefone, role, ativo)
VALUES
  ('odair.orso78@gmail.com', 'Odair Roberto dos Santos', '(67) 99974-8109', 'admin', true),
  ('odair_orso@hotmail.com', 'Odair Roberto dos Santos', '(67) 99974-8109', 'admin', true),
  ('veiculos.oliveira@gmail.com', 'Oliveira Veículos (Administrador)', '(67) 99622-9840', 'admin', true)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', ativo = true;

-- Fim do script de segurança
