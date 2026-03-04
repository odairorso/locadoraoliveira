-- =============================================
-- Script para adicionar suporte a CNPJ na tabela clientes
-- Execute este script no Neon (console SQL)
-- =============================================

-- 1. Adicionar coluna tipo_pessoa (pf = Pessoa Física, pj = Pessoa Jurídica)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2) DEFAULT 'pf';

-- 2. Renomear coluna cpf para cpf_cnpj
ALTER TABLE clientes RENAME COLUMN cpf TO cpf_cnpj;

-- 3. Alterar tamanho da coluna para suportar CNPJ (18 caracteres com formatação)
ALTER TABLE clientes ALTER COLUMN cpf_cnpj TYPE VARCHAR(20);

-- 4. Atualizar todos os registros existentes como Pessoa Física
UPDATE clientes SET tipo_pessoa = 'pf' WHERE tipo_pessoa IS NULL;

-- 5. Tornar tipo_pessoa NOT NULL após definir valores
ALTER TABLE clientes ALTER COLUMN tipo_pessoa SET NOT NULL;
