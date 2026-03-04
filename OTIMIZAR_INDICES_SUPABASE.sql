-- Índices recomendados para melhorar performance de buscas e listagens
-- Execute no SQL Editor do Supabase (ajuste nomes de colunas conforme seu esquema)

-- Clientes: busca por nome e por documento
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='documento') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes (documento)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='cpf_cnpj') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes (cpf_cnpj)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='cpf') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf)';
  END IF;
END $$;

-- Veículos: filtros por status
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos (status);

-- Locações: ordenação/listagem recente e status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locacoes' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_locacoes_created_at ON locacoes (created_at)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_locacoes_status ON locacoes (status);

-- Movimentações financeiras: filtros por data
CREATE INDEX IF NOT EXISTS idx_mov_fin_data ON movimentacoes_financeiras (data_movimentacao);

-- Vistorias: relacionamentos
CREATE INDEX IF NOT EXISTS idx_vistorias_locacao ON vistorias (locacao_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_cliente ON vistorias (cliente_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_veiculo ON vistorias (veiculo_id);

