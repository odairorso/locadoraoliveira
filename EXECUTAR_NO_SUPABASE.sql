-- Execute este SQL no painel do Supabase
-- Vá em: https://supabase.com/dashboard/project/uvqyxpwlgltnskjdbwzt/sql

-- Adicionar coluna fotos na tabela vistorias
ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]';

-- Criar índice para melhor performance nas consultas de fotos
CREATE INDEX IF NOT EXISTS idx_vistorias_fotos ON vistorias USING GIN (fotos);

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vistorias' AND column_name = 'fotos';