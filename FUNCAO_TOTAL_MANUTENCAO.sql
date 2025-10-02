-- Função para calcular total de manutenção por veículo
-- Execute este script no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION calcular_total_manutencao_por_veiculo()
RETURNS TABLE (
    veiculo_id BIGINT,
    veiculo_info JSONB,
    total_gasto NUMERIC,
    quantidade_manutencoes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.veiculo_id,
        jsonb_build_object(
            'id', v.id,
            'marca', v.marca,
            'modelo', v.modelo,
            'placa', v.placa,
            'ano', v.ano
        ) as veiculo_info,
        COALESCE(SUM(m.valor), 0) as total_gasto,
        COUNT(m.id) as quantidade_manutencoes
    FROM veiculos v
    LEFT JOIN manutencoes m ON v.id = m.veiculo_id
    GROUP BY v.id, v.marca, v.modelo, v.placa, v.ano, m.veiculo_id
    ORDER BY total_gasto DESC;
END;
$$;