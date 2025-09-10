-- ===================================================================
-- SCRIPT PARA CRIAR LANÇAMENTOS FINANCEIROS FALTANTES
-- ===================================================================
-- Este script lê a sua tabela de 'locacoes' e cria os registros
-- de 'entrada' correspondentes na tabela 'movimentacoes_financeiras'.
--
-- É seguro executar este script várias vezes.
-- Ele não criará registros duplicados.
-- ===================================================================

INSERT INTO public.movimentacoes_financeiras (tipo, categoria, descricao, valor, data_movimentacao, locacao_id, cliente_id)
SELECT
    'entrada' AS tipo,
    'locacao' AS categoria,
    'Pagamento locação - Cliente ' || c.nome AS descricao,
    l.valor_total AS valor,
    l.created_at AS data_movimentacao,
    l.id AS locacao_id,
    l.cliente_id AS cliente_id
FROM
    public.locacoes l
JOIN
    public.clientes c ON l.cliente_id = c.id
WHERE
    l.id NOT IN (SELECT locacao_id FROM public.movimentacoes_financeiras WHERE locacao_id IS NOT NULL);
