-- Otimizações para o Dashboard
-- Por favor, execute este script no seu Editor de SQL do Supabase.

-- 1. Criar índice na coluna 'status' da tabela 'locacoes'
-- Isso acelera a contagem de locações ativas e a busca por status.
CREATE INDEX IF NOT EXISTS idx_locacoes_status ON locacoes(status);

-- 2. Criar índice na coluna 'created_at' da tabela 'locacoes'
-- Isso acelera a busca de locações por período (ex: receita do mês).
CREATE INDEX IF NOT EXISTS idx_locacoes_created_at ON locacoes(created_at);

-- 3. Criar índice na coluna 'status' da tabela 'veiculos'
-- Isso acelera a contagem de veículos por status (disponível, locado).
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);

-- 4. Criar função para calcular o Saldo de Caixa
-- Soma o valor_total de todas as locações ativas e finalizadas.
-- A API chamará esta função em vez de baixar todos os registros para somar.
CREATE OR REPLACE FUNCTION get_saldo_caixa()
RETURNS TABLE(total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT SUM(valor_total)
  FROM locacoes
  WHERE status IN ('ativa', 'finalizada');
END; $$
LANGUAGE plpgsql;

-- 5. Criar função para calcular a Receita do Mês
-- Soma o valor_total de locações não canceladas no mês corrente.
-- A API passará o mês (ex: '2025-09') e o banco de dados fará a soma.
CREATE OR REPLACE FUNCTION get_receita_mes(month_text TEXT)
RETURNS TABLE(total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT SUM(valor_total)
  FROM locacoes
  WHERE to_char(created_at, 'YYYY-MM') = month_text
  AND status <> 'cancelada';
END; $$
LANGUAGE plpgsql;

-- Fim do script.
-- Após executar, a lentidão no dashboard deve ser resolvida.
