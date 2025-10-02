-- Criar tabela de vistorias
CREATE TABLE IF NOT EXISTS vistorias (
    id SERIAL PRIMARY KEY,
    tipo_vistoria VARCHAR(10) CHECK (tipo_vistoria IN ('entrada', 'saida')) NOT NULL,
    locacao_id INTEGER REFERENCES locacoes(id),
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id),
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    placa VARCHAR(8) NOT NULL,
    modelo VARCHAR(200) NOT NULL,
    cor VARCHAR(50) NOT NULL,
    quilometragem INTEGER NOT NULL,
    nivel_combustivel VARCHAR(10) CHECK (nivel_combustivel IN ('vazio', '1/4', '1/2', '3/4', 'cheio')) NOT NULL,
    nome_condutor VARCHAR(255),
    rg_condutor VARCHAR(20),
    
    -- Itens obrigatórios
    item_calota BOOLEAN DEFAULT true,
    item_pneu BOOLEAN DEFAULT true,
    item_antena BOOLEAN DEFAULT true,
    item_bateria BOOLEAN DEFAULT true,
    item_estepe BOOLEAN DEFAULT true,
    item_macaco BOOLEAN DEFAULT true,
    item_chave_roda BOOLEAN DEFAULT true,
    item_triangulo BOOLEAN DEFAULT true,
    item_extintor BOOLEAN DEFAULT true,
    item_tapetes BOOLEAN DEFAULT true,
    item_som BOOLEAN DEFAULT true,
    item_documentos BOOLEAN DEFAULT true,
    item_higienizacao BOOLEAN DEFAULT true,
    
    -- Avarias (JSON)
    avarias TEXT,
    
    -- Observações
    observacoes TEXT,
    
    -- Assinaturas
    assinatura_cliente TEXT,
    assinatura_vistoriador TEXT,
    nome_vistoriador VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_vistorias_veiculo_id ON vistorias(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_cliente_id ON vistorias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_locacao_id ON vistorias(locacao_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_tipo ON vistorias(tipo_vistoria);

-- Desabilitar RLS para permitir acesso anônimo
ALTER TABLE vistorias DISABLE ROW LEVEL SECURITY;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_vistorias_updated_at ON vistorias;
CREATE TRIGGER update_vistorias_updated_at
    BEFORE UPDATE ON vistorias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();