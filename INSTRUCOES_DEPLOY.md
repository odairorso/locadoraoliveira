# 🚀 INSTRUÇÕES COMPLETAS PARA DEPLOY

## 📋 PASSO A PASSO PARA GITHUB

### 1. Primeiro, abra o terminal/prompt na pasta do seu projeto

```bash
# Vá para a pasta onde você salvou os arquivos
cd caminho/para/sua/pasta/locadoraoliveira

# Inicialize o repositório Git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Sistema completo de locadora - versão inicial"

# Conecte com seu repositório do GitHub
git remote add origin https://github.com/odairorso/locadoraoliveira.git

# Envie os arquivos para o GitHub
git push -u origin main
```

**Se der erro de branch, use estes comandos:**
```bash
git branch -M main
git push -u origin main
```

**Se pedir login:**
- Usuario: odairorso
- Token: (use um Personal Access Token do GitHub, não a senha)

---

## 🗄️ TABELAS PARA SUPABASE (SQL EDITOR)

### Cole este código no SQL Editor do Supabase:

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

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (CUIDADO: apenas para desenvolvimento)
CREATE POLICY "Allow all operations" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON veiculos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON locacoes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vendas FOR ALL USING (true);
```

---

## 🌐 CONFIGURAÇÃO DO NETLIFY

### 1. Acesse https://netlify.com e faça login

### 2. Clique em "New site from Git"

### 3. Escolha GitHub e autorize

### 4. Selecione seu repositório: odairorso/locadoraoliveira

### 5. Configure o build:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### 6. Adicione as variáveis de ambiente:
- **SUPABASE_URL:** `https://uvqyxpwlgltnskjdbwzt.supabase.co`
- **SUPABASE_ANON_KEY:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0`

### 7. Clique em "Deploy site"

---

## ⚡ COMANDOS RÁPIDOS

### Se já tem Git configurado:
```bash
git add .
git commit -m "Atualização do sistema"
git push origin main
```

### Para instalar dependências localmente:
```bash
npm install
npm run dev
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro "repository not found":
```bash
git remote set-url origin https://github.com/odairorso/locadoraoliveira.git
```

### Erro de permissão no GitHub:
- Vá em GitHub > Settings > Developer settings > Personal access tokens
- Crie um novo token com permissões de repositório
- Use o token como senha

### Build falha no Netlify:
- Verifique se as variáveis de ambiente estão configuradas
- Vá em Site settings > Environment variables

---

## 📞 RESUMO DOS PASSOS

1. ✅ **Terminal:** Execute os comandos do Git na pasta do projeto
2. ✅ **Supabase:** Cole o SQL no editor e execute
3. ✅ **Netlify:** Conecte o GitHub e configure as variáveis
4. ✅ **Teste:** Acesse seu site no Netlify e teste o sistema

**Seu site ficará no formato:** `https://seu-nome-do-site.netlify.app`
