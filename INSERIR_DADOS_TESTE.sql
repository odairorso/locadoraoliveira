-- DADOS DE TESTE PARA MOVIMENTAÇÕES FINANCEIRAS
-- Execute este SQL no Supabase para adicionar dados de exemplo

-- Inserir algumas movimentações de entrada (receitas)
INSERT INTO movimentacoes_financeiras (tipo, categoria, descricao, valor, data_movimentacao) VALUES
('entrada', 'locacao', 'Pagamento locação - Cliente João', 1200.00, '2025-01-01'),
('entrada', 'locacao', 'Pagamento locação - Cliente Maria', 800.00, '2025-01-02'),
('entrada', 'venda', 'Venda de veículo - Civic 2020', 45000.00, '2025-01-03'),
('entrada', 'locacao', 'Pagamento locação - Cliente Pedro', 1500.00, '2025-01-05'),
('entrada', 'locacao', 'Pagamento locação - Cliente Ana', 900.00, '2025-01-07');

-- Inserir algumas movimentações de saída (despesas)
INSERT INTO movimentacoes_financeiras (tipo, categoria, descricao, valor, data_movimentacao) VALUES
('saida', 'despesa', 'Combustível para veículos', 300.00, '2025-01-02'),
('saida', 'despesa', 'Manutenção - Troca de óleo', 150.00, '2025-01-03'),
('saida', 'despesa', 'Seguro dos veículos', 800.00, '2025-01-04'),
('saida', 'despesa', 'Limpeza dos veículos', 200.00, '2025-01-06'),
('saida', 'despesa', 'Documentação veicular', 250.00, '2025-01-08');

-- Verificar se os dados foram inseridos
SELECT 
    tipo,
    categoria,
    descricao,
    valor,
    data_movimentacao
FROM movimentacoes_financeiras 
ORDER BY data_movimentacao DESC;

-- Calcular saldo atual
SELECT 
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo_atual
FROM movimentacoes_financeiras;