-- DADOS DE TESTE PARA MANUTENÇÕES
-- Execute este SQL no Supabase para adicionar dados de exemplo de manutenções

-- Inserir manutenções de teste para diferentes veículos
INSERT INTO manutencoes (veiculo_id, tipo_manutencao, descricao, valor, data_manutencao, status) VALUES
(5, 'preventiva', 'Troca de óleo e filtros', 250.00, '2025-01-15', 'concluida'),
(5, 'corretiva', 'Reparo no sistema de freios', 450.00, '2025-01-20', 'concluida'),
(6, 'preventiva', 'Revisão geral dos 10.000 km', 380.00, '2025-01-18', 'concluida'),
(7, 'corretiva', 'Troca de pneus dianteiros', 600.00, '2025-01-22', 'concluida'),
(8, 'preventiva', 'Alinhamento e balanceamento', 120.00, '2025-01-25', 'concluida'),
(5, 'preventiva', 'Limpeza do ar condicionado', 180.00, '2025-02-01', 'concluida'),
(6, 'corretiva', 'Reparo no sistema elétrico', 320.00, '2025-02-05', 'concluida'),
(7, 'preventiva', 'Troca de velas e cabos', 200.00, '2025-02-10', 'concluida');

-- Verificar se os dados foram inseridos
SELECT 
    m.id,
    v.marca,
    v.modelo,
    v.placa,
    m.tipo_manutencao,
    m.descricao,
    m.valor,
    m.data_manutencao,
    m.status
FROM manutencoes m
JOIN veiculos v ON m.veiculo_id = v.id
ORDER BY m.data_manutencao DESC;

-- Calcular total de manutenções por veículo
SELECT 
    v.marca,
    v.modelo,
    v.placa,
    COUNT(m.id) as total_manutencoes,
    SUM(m.valor) as custo_total_manutencao
FROM veiculos v
LEFT JOIN manutencoes m ON v.id = m.veiculo_id
GROUP BY v.id, v.marca, v.modelo, v.placa
ORDER BY custo_total_manutencao DESC;