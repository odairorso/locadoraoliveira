-- =====================================================================
-- CORRECAO RE-AUDITORIA — SUPABASE (idempotente; pode rodar mais de uma vez)
-- =====================================================================
-- Problemas encontrados na re-auditoria ao vivo (26/08/2026):
--   1. CRITICO: RLS DESLIGADO na tabela `perfis` — qualquer pessoa (anon)
--      podia LER (emails/cargos da equipe), INSERIR e EXCLUIR perfis.
--   2. ALTO: coluna `renavam` legível por anônimos em `veiculos`.
--   3. ALTO: RPCs transacionais (criar_locacao/atualizar_locacao/excluir_locacao)
--      NÃO existem no banco — o app usa fallback não-transacional.
--
-- Este script corrige os 3 itens e é independente do SUPABASE_SECURITY_RLS.sql
-- (que continua sendo a referência completa de segurança).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RLS em `perfis` + políticas corretas
-- ---------------------------------------------------------------------
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis Select Proprio Ou Admin" ON perfis;
DROP POLICY IF EXISTS "Perfis Insert Proprio Cliente" ON perfis;
DROP POLICY IF EXISTS "Perfis Admin Manage" ON perfis;

-- SELECT: só o próprio usuário (por email ou user_id) ou admin
CREATE POLICY "Perfis Select Proprio Ou Admin" ON perfis
  FOR SELECT
  TO authenticated
  USING (
    email = lower(auth.jwt() ->> 'email')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR public.is_admin()
  );

-- INSERT: usuário pode criar apenas o PRÓPRIO perfil como 'cliente'
CREATE POLICY "Perfis Insert Proprio Cliente" ON perfis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = lower(auth.jwt() ->> 'email')
    AND role = 'cliente'
  );

-- UPDATE/DELETE/ALL: apenas admin (o trigger trg_verificar_role_perfil
-- reforça que role só muda por admin)
CREATE POLICY "Perfis Admin Manage" ON perfis
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Coluna `renavam` de `veiculos` não é pública
-- ---------------------------------------------------------------------
-- A equipe (authenticated) continua acessando; apenas o papel anon perde
-- a coluna. A página pública usa a view catalogo_publico (sem renavam).
REVOKE SELECT (renavam) ON veiculos FROM anon;
GRANT SELECT (id, marca, modelo, ano, placa, cor, valor_diaria, valor_veiculo,
  tipo_operacao, status, foto_principal, fotos, quilometragem_atual, observacoes)
  ON veiculos TO anon;

-- ---------------------------------------------------------------------
-- 3. Funções de cargo (necessárias para as políticas e RPCs)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. RPC transacional de CRIAÇÃO de locação
-- ---------------------------------------------------------------------
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
    v_cliente_id, v_veiculo_id, v_data_locacao, v_data_entrega,
    coalesce((p->>'valor_diaria')::numeric, 0),
    coalesce((p->>'valor_total')::numeric, 0),
    coalesce((p->>'valor_caucao')::numeric, 0),
    coalesce((p->>'valor_seguro')::numeric, 0),
    coalesce(p->>'status', 'ativa'),
    p->>'observacoes'
  )
  RETURNING * INTO v_locacao;

  UPDATE public.veiculos SET status = 'locado' WHERE id = v_veiculo_id;

  IF coalesce(v_locacao.valor_total, 0) > 0 THEN
    INSERT INTO public.movimentacoes_financeiras (
      tipo, categoria, descricao, valor, data_movimentacao, locacao_id, cliente_id
    ) VALUES (
      'entrada', 'locacao', 'Recebimento da Locação #' || v_locacao.id,
      v_locacao.valor_total, v_data_locacao, v_locacao.id, v_cliente_id
    );
  END IF;

  IF coalesce(v_locacao.valor_seguro, 0) > 0 THEN
    INSERT INTO public.movimentacoes_financeiras (
      tipo, categoria, descricao, valor, data_movimentacao, locacao_id, cliente_id
    ) VALUES (
      'entrada', 'seguro', 'Recebimento de Seguro - Locação #' || v_locacao.id,
      v_locacao.valor_seguro, v_data_locacao, v_locacao.id, v_cliente_id
    );
  END IF;

  SELECT placa, coalesce(marca || ' ', '') || modelo, cor
    INTO v_placa, v_modelo, v_cor
  FROM public.veiculos WHERE id = v_veiculo_id;

  SELECT nome INTO v_condutor FROM public.clientes WHERE id = v_cliente_id;

  INSERT INTO public.vistorias (
    veiculo_id, cliente_id, locacao_id, tipo_vistoria,
    placa, modelo, cor, quilometragem, nivel_combustivel,
    nome_condutor, nome_vistoriador, observacoes, data_vistoria
  ) VALUES (
    v_veiculo_id, v_cliente_id, v_locacao.id, 'saida',
    coalesce(v_placa, 'N/D'), coalesce(v_modelo, 'N/D'), coalesce(v_cor, 'N/D'),
    0, 'cheio', coalesce(v_condutor, ''), 'Sistema',
    'Vistoria inicial criada automaticamente para a locação #' || v_locacao.id,
    now()
  );

  RETURN v_locacao;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_locacao(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_locacao(jsonb) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. RPC transacional de ATUALIZAÇÃO de locação
-- ---------------------------------------------------------------------
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

  IF v_novo_veiculo_id != v_locacao_antiga.veiculo_id THEN
    UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_locacao_antiga.veiculo_id;
    IF v_novo_status = 'ativa' THEN
      UPDATE public.veiculos SET status = 'locado' WHERE id = v_novo_veiculo_id;
    END IF;
  ELSE
    IF v_novo_status IN ('finalizada', 'cancelada') THEN
      UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_novo_veiculo_id;
    ELSIF v_novo_status = 'ativa' THEN
      UPDATE public.veiculos SET status = 'locado' WHERE id = v_novo_veiculo_id;
    END IF;
  END IF;

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

-- ---------------------------------------------------------------------
-- 6. RPC transacional de EXCLUSÃO de locação
-- ---------------------------------------------------------------------
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

  IF v_veiculo_id IS NOT NULL THEN
    UPDATE public.veiculos SET status = 'disponivel' WHERE id = v_veiculo_id;
  END IF;

  DELETE FROM public.locacoes WHERE id = p_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.excluir_locacao(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_locacao(integer) TO authenticated;

-- =====================================================================
-- FIM. Depois de rodar, confira com:
--   SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='perfis';
--   SELECT proname FROM pg_proc WHERE proname LIKE 'criar_locacao%';
-- =====================================================================
