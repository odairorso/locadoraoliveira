-- Certifique-se de que a extensão uuid-ossp está habilitada se você estiver gerando UUIDs
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inserir dados de clientes de exemplo
INSERT INTO clientes (id, nome, cpf, telefone) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'João Silva', '111.222.333-44', '(11) 98765-4321'),
('b1cdef01-2345-6789-abcd-ef0123456789', 'Maria Souza', '555.666.777-88', '(21) 91234-5678'),
('c2d3e4f5-6789-0123-4567-890123456789', 'Pedro Santos', '999.888.777-66', '(31) 99887-6655')
ON CONFLICT (id) DO NOTHING; -- Evita erro se o ID já existir

-- Inserir dados de veículos de exemplo
INSERT INTO veiculos (id, placa, modelo, marca, quilometragem_atual) VALUES
('d3e4f5a6-7890-1234-5678-901234567890', 'ABC1234', 'Onix', 'Chevrolet', 50000),
('e4f5a6b7-8901-2345-6789-012345678901', 'XYZ5678', 'HB20', 'Hyundai', 25000),
('f5a6b7c8-9012-3456-7890-123456789012', 'DEF9012', 'Corolla', 'Toyota', 75000)
ON CONFLICT (id) DO NOTHING; -- Evita erro se o ID já existir
