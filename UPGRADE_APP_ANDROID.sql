-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS - OLIVEIRA VEÍCULOS (APP ANDROID & MULTI-PERFIL)
-- Execute este script no SQL Editor do Supabase (uvqyxpwlgltnskjdbwzt)
-- ==============================================================================

-- 1. ADICIONAR SUPORTE A FOTOS E DETALHES NOS VEÍCULOS
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS foto_principal TEXT,
ADD COLUMN IF NOT EXISTS transmissao VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS combustivel VARCHAR(30) DEFAULT 'flex',
ADD COLUMN IF NOT EXISTS passageiros INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS tem_ar_condicionado BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tem_direcao_hidraulica BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tem_vidro_eletrico BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 2. TABELA DE PERFIS DE USUÁRIOS (ADMIN, FUNCIONÁRIO, CLIENTE)
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('admin', 'funcionario', 'cliente')) DEFAULT 'cliente',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir ou atualizar perfil do Administrador Master (Dono)
INSERT INTO perfis (email, nome, telefone, role, ativo)
VALUES ('veiculos.oliveira@gmail.com', 'João Roberto (Oliveira Veículos)', '(67) 99622-9840', 'admin', true)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', nome = 'João Roberto (Oliveira Veículos)', telefone = '(67) 99622-9840', ativo = true;

-- 3. TABELA DE CONFIGURAÇÕES DA EMPRESA & CHAVE PIX
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
    id SERIAL PRIMARY KEY,
    nome_empresa VARCHAR(255) DEFAULT 'Oliveira Veículos - Locação e Vendas',
    cnpj VARCHAR(20) DEFAULT '00.871.429/0001-01',
    telefone VARCHAR(20) DEFAULT '(67) 99622-9840',
    whatsapp VARCHAR(20) DEFAULT '5567996229840',
    email VARCHAR(255) DEFAULT 'veiculos.oliveira@gmail.com',
    endereco VARCHAR(255) DEFAULT 'Av. Campo Grande, 707 - Centro',
    cidade VARCHAR(100) DEFAULT 'Naviraí',
    estado CHAR(2) DEFAULT 'MS',
    -- Configuração do PIX
    tipo_chave_pix VARCHAR(20) DEFAULT 'email', -- 'cnpj', 'celular', 'email', 'aleatoria'
    chave_pix VARCHAR(255) DEFAULT 'veiculos.oliveira@gmail.com',
    titular_pix VARCHAR(255) DEFAULT 'JOAO ROBERTO DOS SANTOS DE OLIVEIRA',
    cidade_pix VARCHAR(100) DEFAULT 'NAVIRAI',
    link_playstore VARCHAR(255) DEFAULT 'https://play.google.com/store/apps/details?id=com.locadoraoliveira.app',
    mensagem_compartilhamento TEXT DEFAULT 'Confira nossos veículos disponíveis para locação e faça sua reserva na Oliveira Veículos!',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garantir que existe ao menos 1 registro de configuração
INSERT INTO configuracoes_empresa (id, nome_empresa, chave_pix, tipo_chave_pix, titular_pix, cidade_pix, whatsapp)
VALUES (1, 'Oliveira Veículos', 'veiculos.oliveira@gmail.com', 'email', 'JOAO ROBERTO DOS SANTOS DE OLIVEIRA', 'NAVIRAI', '5567996229840')
ON CONFLICT (id) DO NOTHING;

-- 4. TABELA DE SOLICITAÇÕES DE RESERVA FEITAS POR CLIENTES PELO APP / LINK
CREATE TABLE IF NOT EXISTS solicitacoes_reserva (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_cpf VARCHAR(20) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(255),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias INTEGER NOT NULL DEFAULT 1,
    valor_diaria NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50) DEFAULT 'pix',
    comprovante_pix_url TEXT,
    status VARCHAR(20) CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada')) DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. POLÍTICAS DE ACESSO (ROW LEVEL SECURITY)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_reserva ENABLE ROW LEVEL SECURITY;

-- Perfis: Leitura apenas do próprio perfil ou se for admin; gestão apenas admin
DROP POLICY IF EXISTS "Leitura pública de perfis" ON perfis;
DROP POLICY IF EXISTS "Gerenciamento de perfis" ON perfis;
CREATE POLICY "Perfis Leitura Proprio Ou Admin" ON perfis
  FOR SELECT TO authenticated
  USING (email = lower(auth.jwt() ->> 'email') OR (user_id IS NOT NULL AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Perfis Gestao Admin" ON perfis
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Configurações: Leitura pública para catálogo/PIX; alteração apenas equipe/admin
DROP POLICY IF EXISTS "Leitura de configurações da empresa" ON configuracoes_empresa;
DROP POLICY IF EXISTS "Atualização de configurações da empresa" ON configuracoes_empresa;
CREATE POLICY "Configuracoes Leitura Publica" ON configuracoes_empresa
  FOR SELECT USING (true);
CREATE POLICY "Configuracoes Gestao Equipe" ON configuracoes_empresa
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Solicitações de Reserva: Inserção pública permitida para clientes; gestão e leitura restritas à equipe
DROP POLICY IF EXISTS "Inserção pública de reservas por clientes" ON solicitacoes_reserva;
DROP POLICY IF EXISTS "Leitura e gestão de reservas" ON solicitacoes_reserva;
CREATE POLICY "Solicitacoes Insercao Publica" ON solicitacoes_reserva
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Solicitacoes Gestao Equipe" ON solicitacoes_reserva
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Atualizar fotos de exemplo para os veículos existentes caso estejam sem foto
UPDATE veiculos 
SET foto_principal = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    fotos = '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"]'::jsonb
WHERE modelo ILIKE '%onix%' AND (foto_principal IS NULL OR foto_principal = '');

UPDATE veiculos 
SET foto_principal = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    fotos = '["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80"]'::jsonb
WHERE modelo ILIKE '%polo%' AND (foto_principal IS NULL OR foto_principal = '');

UPDATE veiculos 
SET foto_principal = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    fotos = '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"]'::jsonb
WHERE modelo ILIKE '%gol%' AND (foto_principal IS NULL OR foto_principal = '');

UPDATE veiculos 
SET foto_principal = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    fotos = '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"]'::jsonb
WHERE (modelo ILIKE '%saveiro%' OR modelo ILIKE '%mobi%' OR modelo ILIKE '%kwid%' OR modelo ILIKE '%voyage%') AND (foto_principal IS NULL OR foto_principal = '');
