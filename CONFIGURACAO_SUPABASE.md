# Configuração do Sistema com Supabase

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Conta no [Netlify](https://netlify.com)
3. Node.js instalado (versão 18 ou superior)

## 🚀 Configuração do Banco de Dados no Supabase

### Passo 1: Criar as Tabelas

1. Acesse seu projeto no Supabase
2. Vá para o **SQL Editor**
3. Cole e execute o conteúdo do arquivo `supabase_schema.sql`
4. Verifique se as tabelas foram criadas em **Table Editor**

### Passo 2: Verificar as Credenciais

As credenciais já estão configuradas no código:
- **URL**: `https://uvqyxpwlgltnskjdbwzt.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **IMPORTANTE**: Em produção, essas credenciais devem ser movidas para variáveis de ambiente!

## 🔧 Configuração do Netlify

### Passo 1: Deploy Automático

O projeto está configurado para deploy automático quando você faz push para o GitHub:
- Repository: https://github.com/odairorso/locadoraoliveira.git
- Site: https://locadoraoliveira.netlify.app

### Passo 2: Variáveis de Ambiente (Recomendado)

No painel do Netlify, adicione as seguintes variáveis de ambiente:

```
SUPABASE_URL=https://uvqyxpwlgltnskjdbwzt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 3: Instalação de Dependências

O Netlify instalará automaticamente as dependências durante o build:
- Dependências do projeto principal (package.json)
- Dependências das funções (netlify/functions/package.json)

## 📁 Estrutura do Projeto

```
/
├── src/
│   ├── react-app/          # Frontend React
│   ├── worker/             # Worker (não usado no Netlify)
│   └── shared/             # Tipos TypeScript compartilhados
├── netlify/
│   └── functions/          # Funções serverless do Netlify
│       ├── dashboard.js    # API Dashboard
│       ├── clientes.js     # API Clientes
│       ├── veiculos.js     # API Veículos
│       ├── locacoes.js     # API Locações
│       └── package.json    # Dependências das funções
├── netlify.toml            # Configuração do Netlify
├── package.json            # Dependências do projeto
└── supabase_schema.sql     # Schema do banco de dados
```

## 🔄 Fluxo de Requisições

1. Frontend faz requisição para `/api/endpoint`
2. Netlify redireciona para `/.netlify/functions/endpoint`
3. Função serverless processa a requisição
4. Função se conecta ao Supabase
5. Retorna os dados para o frontend

## 🛠️ Desenvolvimento Local

### Executar o projeto localmente:

```bash
# Instalar dependências
npm install

# Instalar dependências das funções
cd netlify/functions
npm install
cd ../..

# Executar o projeto
npm run dev
```

### Testar as funções localmente:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Executar funções localmente
netlify dev
```

## 📊 Tabelas do Banco de Dados

### Tabela: `clientes`
- `id`: ID único
- `nome`: Nome completo
- `cpf`: CPF (único)
- `celular`: Telefone
- `email`: E-mail
- `endereco`: Endereço
- `bairro`: Bairro (opcional)
- `cidade`: Cidade (opcional)
- `estado`: Estado - 2 letras (opcional)
- `cep`: CEP (opcional)

### Tabela: `veiculos`
- `id`: ID único
- `modelo`: Modelo do veículo
- `marca`: Marca
- `ano`: Ano de fabricação
- `placa`: Placa (única)
- `renavam`: RENAVAM (único)
- `cor`: Cor
- `valor_diaria`: Valor da diária
- `valor_veiculo`: Valor do veículo
- `tipo_operacao`: 'locacao', 'venda' ou 'ambos'
- `status`: 'disponivel', 'locado', 'vendido' ou 'manutencao'

### Tabela: `locacoes`
- `id`: ID único
- `cliente_id`: Referência ao cliente
- `veiculo_id`: Referência ao veículo
- `data_locacao`: Data de início
- `data_entrega`: Data de término
- `valor_diaria`: Valor da diária
- `valor_total`: Valor total
- `valor_caucao`: Valor da caução
- `status`: 'ativa', 'finalizada', 'cancelada' ou 'reservada'
- `observacoes`: Observações (opcional)

## 🔒 Segurança

### Row Level Security (RLS)

O RLS está habilitado em todas as tabelas. As políticas atuais permitem acesso total para usuários anônimos. 

⚠️ **IMPORTANTE**: Para produção, você deve:
1. Criar políticas mais restritivas
2. Implementar autenticação de usuários
3. Ajustar as políticas baseadas em roles

### Exemplo de política mais restritiva:

```sql
-- Permitir apenas leitura para usuários anônimos
CREATE POLICY "Read only for anon" ON clientes 
FOR SELECT USING (auth.role() = 'anon');

-- Permitir todas as operações apenas para usuários autenticados
CREATE POLICY "Full access for authenticated" ON clientes 
FOR ALL USING (auth.role() = 'authenticated');
```

## 🐛 Solução de Problemas

### Erro: "Failed to get session"
- Verifique se as credenciais do Supabase estão corretas
- Verifique se as tabelas foram criadas no Supabase
- Verifique se o RLS está configurado corretamente

### Erro: "404 Not Found" nas APIs
- Verifique se os redirects estão configurados no `netlify.toml`
- Verifique se as funções foram deployadas corretamente

### Erro: "CORS"
- As funções já incluem headers CORS
- Se persistir, verifique as configurações do Supabase

## 📝 Próximos Passos

1. **Mover credenciais para variáveis de ambiente**
2. **Implementar autenticação de usuários**
3. **Ajustar políticas de segurança no Supabase**
4. **Adicionar validação de dados mais robusta**
5. **Implementar logs e monitoramento**
6. **Adicionar testes automatizados**

## 📞 Suporte

Para dúvidas ou problemas:
- Email: veiculos.oliveira@gmail.com
- WhatsApp: (67) 99622.9840

---

**Última atualização**: 08/01/2025
