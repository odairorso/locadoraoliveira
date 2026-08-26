-- =====================================================================
-- FIX RENAVAM ANON (26/08/2026)
-- =====================================================================
-- O anon tinha GRANT SELECT de TABELA inteira em veiculos (de scripts
-- antigos). Nesse caso, REVOKE apenas na coluna renavam NÃO tem efeito.
-- Solução: revogar o SELECT da tabela e conceder somente as colunas
-- públicas do catálogo (sem renavam). A equipe (authenticated) não é
-- afetada (grant de tabela permanece para ela).
-- =====================================================================

REVOKE SELECT ON veiculos FROM anon;

GRANT SELECT (id, marca, modelo, ano, placa, cor, valor_diaria, valor_veiculo,
  tipo_operacao, status, foto_principal, fotos, transmissao, combustivel,
  passageiros, tem_ar_condicionado, tem_direcao_hidraulica, tem_vidro_eletrico,
  descricao)
  ON veiculos TO anon;

-- FIM. Para conferir: tente SELECT renavam como anon (deve falhar) e
-- SELECT das colunas acima (deve funcionar).
