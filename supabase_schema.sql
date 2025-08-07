-- Criação das tabelas para o sistema de locação de veículos no Supabase

-- Tabela de clientes
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

-- Tabela de veículos
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

-- Tabela de locações
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

-- Índices para melhorar performance
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_veiculos_status ON veiculos(status);
CREATE INDEX idx_locacoes_cliente_id ON locacoes(cliente_id);
CREATE INDEX idx_locacoes_veiculo_id ON locacoes(veiculo_id);
CREATE INDEX idx_locacoes_status ON locacoes(status);
CREATE INDEX idx_locacoes_data_locacao ON locacoes(data_locacao);
CREATE INDEX idx_locacoes_data_entrega ON locacoes(data_entrega);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locacoes_updated_at BEFORE UPDATE ON locacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - importante para Supabase
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (permite acesso total para usuários anônimos - ajuste conforme necessário)
CREATE POLICY "Enable read access for all users" ON clientes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON clientes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON clientes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON veiculos FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON veiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON veiculos FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON veiculos FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON locacoes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON locacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON locacoes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON locacoes FOR DELETE USING (true);

-- Dados de exemplo (opcional - remova se não quiser dados de teste)
-- INSERT INTO clientes (nome, cpf, celular, email, endereco, bairro, cidade, estado, cep)
-- VALUES 
--     ('João Silva', '111.111.111-11', '(11) 91111-1111', 'joao@email.com', 'Rua A, 123', 'Centro', 'São Paulo', 'SP', '01000-000'),
--     ('Maria Santos', '222.222.222-22', '(11) 92222-2222', 'maria@email.com', 'Rua B, 456', 'Jardim', 'São Paulo', 'SP', '02000-000');

-- INSERT INTO veiculos (modelo, marca, ano, placa, renavam, cor, valor_diaria, valor_veiculo, tipo_operacao)
-- VALUES 
--     ('Civic', 'Honda', 2022, 'ABC-1234', '12345678901', 'Preto', 150.00, 120000.00, 'locacao'),
--     ('Corolla', 'Toyota', 2023, 'DEF-5678', '98765432109', 'Branco', 180.00, 140000.00, 'ambos'),
--     ('Onix', 'Chevrolet', 2021, 'GHI-9012', '45678901234', 'Prata', 100.00, 80000.00, 'locacao');
