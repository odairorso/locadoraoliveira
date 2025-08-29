-- COPIE TODO ESTE CÓDIGO E COLE NO SQL EDITOR DO SUPABASE, DEPOIS CLIQUE EM RUN

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    celular VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    placa VARCHAR(8) UNIQUE NOT NULL,
    renavam VARCHAR(20) UNIQUE NOT NULL,
    cor VARCHAR(50) NOT NULL,
    valor_diaria DECIMAL(10, 2),
    valor_veiculo DECIMAL(10, 2) NOT NULL,
    tipo_operacao VARCHAR(20) CHECK (tipo_operacao IN ('locacao', 'venda', 'ambos')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('disponivel', 'locado', 'vendido', 'manutencao')) DEFAULT 'disponivel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de locações
CREATE TABLE IF NOT EXISTS locacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id),
    data_locacao DATE NOT NULL,
    data_entrega DATE NOT NULL,
    valor_diaria DECIMAL(10, 2) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    valor_caucao DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('ativa', 'finalizada', 'cancelada', 'reservada')) DEFAULT 'ativa',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de movimentações financeiras (caixa)
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'locacao', 'venda', 'despesa', etc.
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_movimentacao DATE NOT NULL,
    locacao_id INTEGER REFERENCES locacoes(id),
    cliente_id INTEGER REFERENCES clientes(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);
CREATE INDEX IF NOT EXISTS idx_locacoes_cliente_id ON locacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_locacoes_veiculo_id ON locacoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_locacoes_status ON locacoes(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria ON movimentacoes_financeiras(categoria);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_financeiras(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_locacao_id ON movimentacoes_financeiras(locacao_id);

-- DESABILITAR RLS TEMPORARIAMENTE PARA FUNCIONAR SEM AUTENTICAÇÃO
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_financeiras DISABLE ROW LEVEL SECURITY;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_veiculos_updated_at ON veiculos;
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locacoes_updated_at ON locacoes;
CREATE TRIGGER update_locacoes_updated_at BEFORE UPDATE ON locacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INSERIR DADOS DE TESTE PARA VERIFICAR SE ESTÁ FUNCIONANDO
INSERT INTO clientes (nome, cpf, celular, email, endereco, bairro, cidade, estado, cep)
VALUES 
    ('Cliente Teste', '111.111.111-11', '(67) 99999-9999', 'teste@email.com', 'Rua Teste, 123', 'Centro', 'Campo Grande', 'MS', '79000-000')
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO veiculos (modelo, marca, ano, placa, renavam, cor, valor_diaria, valor_veiculo, tipo_operacao, status)
VALUES 
    ('Onix', 'Chevrolet', 2023, 'TST-1234', '12345678901', 'Preto', 150.00, 80000.00, 'locacao', 'disponivel'),
    ('HB20', 'Hyundai', 2023, 'TST-5678', '98765432109', 'Branco', 140.00, 75000.00, 'locacao', 'disponivel')
ON CONFLICT (placa) DO NOTHING;

-- VERIFICAR SE AS TABELAS FORAM CRIADAS
SELECT 'Tabelas criadas com sucesso!' as mensagem;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_veiculos FROM veiculos;
SELECT COUNT(*) as total_locacoes FROM locacoes;
