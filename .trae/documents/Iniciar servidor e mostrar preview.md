## Situação Atual
- Não há servidor rodando, então não existe URL de preview disponível agora.
- O frontend usa Vite React e está configurado para a porta `5174` (vite.config.ts:120-122).
- Os scripts disponíveis: `dev`, `preview`, `dev:api`, `dev:full` (package.json:9-17).

## O Que Vou Fazer
1. Instalar dependências se necessário (`npm install`).
2. Iniciar o servidor de desenvolvimento do frontend com `npm run dev`.
3. Alternativa: iniciar frontend + API juntos com `npm run dev:full`.
4. Detectar a URL ativa e exibir o preview (esperado: `http://localhost:5174/`).
5. Opcional: rodar `npm run preview` para servir o build (geralmente em `http://localhost:4173/`).

## Verificações
- Confirmar que o servidor iniciou sem erros.
- Abrir a URL e verificar carregamento da página inicial.
- Validar rotas e chamadas `/api/*` locais via plugin do Vite.

## Entregáveis
- URL de preview acessível no navegador.
- Observações rápidas sobre qualquer erro detectado ao iniciar.

## Próximo Passo
- Com sua confirmação, iniciarei o servidor e mostrarei o preview automaticamente.