CREATE TABLE vistorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    veiculo_id UUID REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo_vistoria TEXT NOT NULL, -- 'entrada' ou 'saida'
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quilometragem INTEGER NOT NULL,
    condutor TEXT,
    telefone TEXT,
    combustivel TEXT NOT NULL, -- 'E', '1/4', '1/2', '3/4', 'F'
    observacoes TEXT,

    -- Checklist Items
    calota BOOLEAN DEFAULT FALSE,
    pneus BOOLEAN DEFAULT FALSE,
    antena BOOLEAN DEFAULT FALSE,
    bateria BOOLEAN DEFAULT FALSE,
    estepe BOOLEAN DEFAULT FALSE,
    macaco BOOLEAN DEFAULT FALSE,
    chave_de_roda BOOLEAN DEFAULT FALSE,
    triangulo BOOLEAN DEFAULT FALSE,
    extintor BOOLEAN DEFAULT FALSE,
    tapetes BOOLEAN DEFAULT FALSE,
    som_sistema_audio BOOLEAN DEFAULT FALSE,
    documentos_veiculo BOOLEAN DEFAULT FALSE,
    veiculo_higienizado BOOLEAN DEFAULT FALSE,

    -- Avarias (simplificado para MVP, pode ser JSONB ou tabela separada depois)
    avarias_json JSONB, -- Para armazenar detalhes de avarias, incluindo legendas e posições

    -- Assinaturas (para MVP, pode ser URLs ou base64, ou apenas boolean)
    assinatura_cliente_url TEXT,
    assinatura_vistoriador_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar trigger para updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON vistorias
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- RLS (Row Level Security) - Habilitar e definir políticas
ALTER TABLE vistorias ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados insiram e leiam suas próprias vistorias
CREATE POLICY "Enable read access for all users" ON vistorias FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON vistorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON vistorias FOR UPDATE USING (auth.uid() = user_id); -- Se tiver user_id na tabela
-- CREATE POLICY "Enable delete for authenticated users" ON vistorias FOR DELETE USING (auth.uid() = user_id); -- Se tiver user_id na tabela
