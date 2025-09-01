-- Seed data for contrato data (locação #9)

-- Seed a sample cliente
INSERT INTO clientes (id, nome, cpf, celular, email, endereco, bairro, cidade, estado, cep)
VALUES (101, 'LOCACAO CONTRATO 9', '000.000.000-00', '(11) 9999-9999', NULL, 'Rua Exemplo 9', NULL, 'CidadeExemplo', 'XX', '00000-000');

-- Seed a sample veículo
INSERT INTO veiculos (id, modelo, marca, ano, placa, renavam, cor, valor_diaria, valor_veiculo, tipo_operacao, status)
VALUES (201, 'ModeloSeed', 'MarcaSeed', 2020, 'SEED-01', '99999999999', 'Branco', 120.00, 62000.00, 'locacao', 'disponivel');

-- Seed a locacao with id 9 that references the above cliente e veículo
INSERT INTO locacoes (id, cliente_id, veiculo_id, data_locacao, data_entrega, valor_diaria, valor_total, valor_caucao, status, observacoes)
VALUES (9, 101, 201, '2025-08-01', '2025-08-05', 120.00, 600.00, 0.00, 'ativa', 'Seed data for contrato #9');
