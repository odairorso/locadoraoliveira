-- SCRIPT PARA ADICIONAR CAMPO DE SEGURO NA TABELA LOCACOES
-- Execute este código no SQL Editor do Supabase

-- Adicionar campo valor_seguro na tabela locacoes
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS valor_seguro DECIMAL(10, 2) DEFAULT 0;

-- Comentário para documentar o campo
COMMENT ON COLUMN locacoes.valor_seguro IS 'Valor do seguro da locação';

-- Verificar se o campo foi adicionado corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'locacoes' AND column_name = 'valor_seguro';