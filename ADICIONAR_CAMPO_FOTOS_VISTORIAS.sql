-- Adicionar campo para fotos na tabela vistorias
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;

-- Criar índice para busca em fotos
CREATE INDEX IF NOT EXISTS idx_vistorias_fotos ON vistorias USING GIN (fotos);

-- Comentário explicativo
COMMENT ON COLUMN vistorias.fotos IS 'Array JSON contendo URLs e descrições das fotos da vistoria';