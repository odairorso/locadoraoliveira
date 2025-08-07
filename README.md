# RentCar Pro

Sistema completo de gestão de locadora de veículos, desenvolvido com tecnologias modernas.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Hono.js (Cloudflare Workers)
- **Banco de Dados**: Cloudflare D1 (SQLite) / Supabase
- **Validação**: Zod
- **Icons**: Lucide React
- **Deploy**: Cloudflare Pages / Netlify

## 📋 Funcionalidades

### Dashboard
- Visão geral de locações ativas
- Métricas de veículos disponíveis e locados
- Receita mensal consolidada

### Gestão de Clientes
- Cadastro completo de clientes
- Validação de CPF
- Busca avançada
- Histórico de locações

### Gestão de Veículos
- Cadastro de veículos para locação e/ou venda
- Controle de status (disponível, locado, vendido)
- Informações completas do veículo

### Gestão de Locações
- Processo completo de locação
- Geração automática de contratos
- Controle de datas e valores
- Sistema de caução
- Status de locação

### Contratos
- Geração automática de contratos de locação
- Modelo profissional completo
- Dados dinâmicos do cliente e veículo
- Pronto para impressão

## 🛠️ Configuração do Projeto

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Cloudflare (para D1 e Workers)
- Conta Supabase (opcional)

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd rentcar-pro
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Para Cloudflare D1
cp wrangler.jsonc.example wrangler.jsonc
# Configure seu database_id no wrangler.jsonc

# Para Supabase (opcional)
# Configure SUPABASE_URL e SUPABASE_ANON_KEY
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build do projeto
npm run build

# Deploy no Cloudflare
npm run check && wrangler deploy
```

## 🗃️ Estrutura do Banco de Dados

### Clientes
- ID, Nome, CPF, Celular, Email
- Endereço completo (rua, bairro, cidade, estado, CEP)
- Controle de timestamps

### Veículos
- Informações do veículo (marca, modelo, ano, placa, renavam)
- Valores de venda e locação
- Status e tipo de operação
- Controle de disponibilidade

### Locações
- Relacionamento cliente-veículo
- Datas de locação e entrega
- Valores e caução
- Status da locação
- Observações

## 🚀 Deploy

### Netlify
1. Conecte o repositório ao Netlify
2. Configure os build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Configure as variáveis de ambiente no painel do Netlify

### Cloudflare Pages
1. Conecte o repositório ao Cloudflare Pages
2. Configure o build:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Configure as variáveis de ambiente

## 🔧 Configuração do Supabase

### Criação das Tabelas

```sql
-- Tabela de clientes
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  celular VARCHAR NOT NULL,
  endereco TEXT NOT NULL,
  bairro VARCHAR,
  cidade VARCHAR,
  estado VARCHAR(2),
  cep VARCHAR(10),
  email VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE veiculos (
  id SERIAL PRIMARY KEY,
  modelo VARCHAR NOT NULL,
  marca VARCHAR NOT NULL,
  ano INTEGER NOT NULL,
  placa VARCHAR(8) NOT NULL UNIQUE,
  renavam VARCHAR NOT NULL UNIQUE,
  cor VARCHAR NOT NULL,
  valor_diaria DECIMAL(10,2),
  valor_veiculo DECIMAL(10,2) NOT NULL,
  tipo_operacao VARCHAR CHECK (tipo_operacao IN ('locacao', 'venda', 'ambos')),
  status VARCHAR DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'locado', 'vendido')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de locações
CREATE TABLE locacoes (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  veiculo_id INTEGER REFERENCES veiculos(id),
  data_locacao DATE NOT NULL,
  data_entrega DATE NOT NULL,
  valor_diaria DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_caucao DECIMAL(10,2) DEFAULT 0,
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  veiculo_id INTEGER REFERENCES veiculos(id),
  valor_venda DECIMAL(10,2) NOT NULL,
  data_venda DATE NOT NULL,
  forma_pagamento VARCHAR,
  status VARCHAR DEFAULT 'finalizada',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Configuração Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajustar conforme necessário)
CREATE POLICY "Allow all for authenticated users" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON veiculos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON locacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON vendas FOR ALL USING (auth.role() = 'authenticated');
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

Para suporte ou dúvidas sobre o sistema, entre em contato através do GitHub Issues.
