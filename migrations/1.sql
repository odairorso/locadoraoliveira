
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  celular TEXT NOT NULL,
  endereco TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  modelo TEXT NOT NULL,
  marca TEXT NOT NULL,
  ano INTEGER NOT NULL,
  placa TEXT NOT NULL,
  renavam TEXT NOT NULL,
  cor TEXT NOT NULL,
  valor_diaria REAL,
  valor_veiculo REAL NOT NULL,
  tipo_operacao TEXT NOT NULL,
  status TEXT DEFAULT 'disponivel',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  veiculo_id INTEGER NOT NULL,
  data_locacao DATE NOT NULL,
  data_entrega DATE NOT NULL,
  valor_diaria REAL NOT NULL,
  valor_total REAL NOT NULL,
  status TEXT DEFAULT 'ativa',
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  veiculo_id INTEGER NOT NULL,
  valor_venda REAL NOT NULL,
  data_venda DATE NOT NULL,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'finalizada',
  observacoes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
