# Configuração de Deployment no Vercel

## 🚀 Instruções para Deploy no Vercel

Siga estas instruções para garantir que seu projeto seja corretamente implantado no Vercel.

### 1. Configuração de Variáveis de Ambiente

As seguintes variáveis de ambiente **DEVEM** ser configuradas no painel do Vercel:

```
SUPABASE_URL=https://uvqyxpwlgltnskjdbwzt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0
```

Para adicionar estas variáveis:

1. Acesse o painel do projeto no Vercel
2. Navegue até **Settings > Environment Variables**
3. Adicione cada variável com seu respectivo valor
4. Certifique-se de que as variáveis estão habilitadas para os ambientes **Production**, **Preview** e **Development**

### 2. Configuração do Node.js

O projeto está configurado para usar Node.js versão 20.x conforme especificado no `package.json`. Certifique-se de que o Vercel está configurado para usar esta versão:

1. No painel do Vercel, vá para **Settings > General**
2. Em **Node.js Version**, selecione **20.x**

### 3. Comandos de Build

Os comandos de build já estão configurados no `vercel.json`, mas certifique-se de que estão corretos no painel do Vercel:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Verificação de Rotas API

O arquivo `vercel.json` foi atualizado para incluir todas as rotas API necessárias. Certifique-se de que este arquivo está presente no seu repositório antes de fazer o deploy.

### 5. Solução de Problemas Comuns

#### Erro: "An unexpected error happened when running this build"

Este erro pode ocorrer por várias razões:

1. **Variáveis de ambiente ausentes ou incorretas**
   - Verifique se todas as variáveis de ambiente necessárias estão configuradas corretamente

2. **Versão do Node.js incompatível**
   - Certifique-se de que a versão do Node.js está configurada para 20.x

3. **Problemas com dependências**
   - Tente limpar o cache de build no Vercel e fazer um novo deploy

4. **Conflitos de módulos**
   - Verifique se não há conflitos entre CommonJS e ES Modules

#### Erro: "Function not found"

Se as funções API não estiverem sendo encontradas:

1. Verifique se o arquivo `vercel.json` está configurado corretamente com todas as rotas
2. Certifique-se de que os arquivos .mjs estão presentes na pasta `/api`
3. Verifique se as funções estão exportando corretamente o handler padrão

### 6. Comandos Úteis para Teste Local

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Verificar build localmente
npm run build
```

### 7. Contato para Suporte

Se você continuar enfrentando problemas com o deploy no Vercel, entre em contato com o suporte do Vercel em https://vercel.com/help ou consulte a documentação em https://vercel.com/docs.