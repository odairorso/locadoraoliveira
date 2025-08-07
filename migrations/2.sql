
-- Adicionar novos campos para endereço separado
ALTER TABLE clientes ADD COLUMN bairro TEXT;
ALTER TABLE clientes ADD COLUMN cidade TEXT;
ALTER TABLE clientes ADD COLUMN estado TEXT;
ALTER TABLE clientes ADD COLUMN cep TEXT;

-- Definir valores padrão para registros existentes
UPDATE clientes SET 
  bairro = 'Centro',
  cidade = 'Campo Grande',
  estado = 'MS',
  cep = '79000-000'
WHERE bairro IS NULL;
