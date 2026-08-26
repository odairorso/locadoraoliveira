# 🔍 Relatório de Auditoria — Oliveira Veículos (RentCar Pro)

**Data:** 26/08/2026
**Escopo:** Segurança, qualidade de código, dependências, banco de dados (Supabase), API serverless (Vercel), frontend (React/TS) e app Android (Capacitor).
**Stack auditada:** React 19 + TypeScript + Vite + Tailwind · Supabase (auth + Postgres + RLS) · Vercel serverless (`api/`) · Capacitor Android v2.6.6 (versionCode 42).

---

## 📌 Resumo Executivo

| Área | Veredito |
|---|---|
| Build / TypeScript | ✅ Passa (tsc strict sem erros; lint limpo) |
| Segredos no código-fonte atual | 🔴 **CRÍTICO — senhas reais em texto puro no git** |
| Endpoint serverless de cron | 🔴 **CRÍTICO — service key sem autenticação** |
| Dependências (npm audit) | 🟠 **71 vulnerabilidades (3 críticas, 36 altas)** |
| RLS Supabase | 🟡 Bom design, mas orquestração dos scripts SQL é frágil e há drift de schema |
| Fluxo de Vistorias (checklist) | 🔴 **CRÍTICO funcional — salvar vistoria não grava nada** |
| Frontend (sessão/cache) | 🔴 **CRÍTICO — role forjável no localStorage + cache com CPF/financeiro compartilhado** |
| App Android | 🟡 Configuração correta (sem cleartext, permissões mínimas), ProGuard desligado |

**Veredito geral: o app está funcional e publicado, mas NÃO estava seguro o suficiente para produção.** Os problemas mais graves: (1) senhas reais commitadas no repositório, (2) endpoint de cron com service role key acessível sem login, (3) vulnerabilidades de dependências sem correção, (4) fluxo de vistorias quebrado de forma silenciosa, e (5) sessão/role forjável no navegador com cache de dados sensíveis compartilhado.

---

## ✅ Correções já aplicadas (código — 26/08/2026)

- **C1 (senhas no git):** removidas as senhas hardcoded dos 16 arquivos `test_*`/`inspect_*`/`audit_play_store.mjs` (agora leem `process.env.TEST_ADMIN_PASSWORD`/`TEST_CLIENT_PASSWORD`). ⚠️ **Rotacione as senhas no Supabase e, se o repo for público, purgue o histórico.**
- **C2 (cron):** `api/cron/finalize-locacoes.mjs` agora exige `CRON_SECRET` (header `Authorization` ou `?secret=`), usa o nome correto `SUPABASE_SERVICE_ROLE_KEY`, calcula a data no fuso local e não vaza `error.message`. Configure `CRON_SECRET` no Vercel.
- **C3 (vistorias no-op):** `useApi.ts` ganhou branch `/api/vistorias` (POST/PUT/DELETE via Supabase direto) com mapeamento correto do checklist para `item_*`; `VistoriaForm.tsx` agora consulta Supabase direto (não mais `fetch('/api/...')` anon), carrega checklist/avarias/fotos na edição e trata erros do submit.
- **A2/A3 (API/fetch):** `Manutencao.tsx`, `VistoriaDetalhes.tsx`, `ChecklistDashboard.tsx` convertidos para Supabase direto (funcionam no Android e respeitam RLS).
- **A7/A9 (vazamento/CORS/mass assignment):** removido `details: error.message` de todos os handlers; CORS centralizado no `api/index.mjs` com allowlist por hostname exato; whitelist de campos em `clientes.mjs`, `veiculos.mjs`, `movimentacoes.mjs`; `supabaseClient.mjs` sem service role.
- **C4 (sessão/cache):** `AuthContext` revalida a sessão (descarta `oliveira_auth_session` forjada) e `loading` começa `true`; cache `useApi` não persiste mais endpoints com PII (clientes/locações/financeiro/vistorias).
- **A5/A10/A11/A12 (frontend):** catálogo público sem `renavam`; reserva valida `data_fim >= data_inicio` e corrige falso sucesso de cadastro; fuso horário corrigido em `Relatorios.tsx`/`Locacoes.tsx`.
- **SQL:** criado `HARDENING_RLS_SUPABASE.sql` (trigger anti-elevação de `role`, remoção de policies abertas, view pública sem renavam).

**Pendente (não aplicado para não arriscar o deploy):**
- Atualização das dependências vulneráveis (`hono`, `vite`, `postcss`, `wrangler`, `@capacitor/cli` → `tar`) — requer ciclo próprio de build/teste.
- Remoção da pasta duplicada `Contrato LocaÃ§ao/` do git (higiene; falhou por encoding do terminal — pode ser feita manualmente).
- Execução dos scripts SQL no Supabase (`SUPABASE_SECURITY_RLS.sql` + `HARDENING_RLS_SUPABASE.sql`).

---

## 🔴 CRÍTICO (corrigir imediatamente)

### C1. Senhas de produção em texto plano, versionadas no git
16 arquivos commitados contêm senhas reais em texto puro:
- **`****** (senha do admin)`** (aparentemente senha do admin `odair.orso78@gmail.com`) em: `audit_play_store.mjs`, `inspect_rls.mjs`, `inspect_schema.mjs`, `inspect_manutencoes.mjs`, `inspect_vistorias.mjs`, `inspect_vistorias_keys.mjs`, `test_admin_login.mjs`, `test_clientes_query.mjs`, `test_find_rosangela.mjs`, `test_full_flow.mjs`, `test_login_timing.mjs`, `test_odair_login.mjs`, `test_session_expiration.mjs`, `test_vault_recovery.mjs`.
- **`123456`** (cliente de teste) em `test_rosangela_login.mjs`, `test_client_signup.mjs`, `audit_play_store.mjs`.
- Introduzidos no commit `9f66bc8` (25/08/2026) e presentes no histórico do repo `github.com/odairorso/locadoraoliveira`. O ESLint ignora `*.mjs`/`*.js`/`api/**` (`eslint.config.js:18-22`), por isso passaram despercebidos.

**Risco:** quem tiver acesso ao repositório (ou ao histórico, se público/compartilhado) obtém acesso de admin ao app e ao Supabase.
**Correção:**
1. **Rotacionar todas as senhas agora** (Supabase Auth + quaisquer contas reutilizando-as).
2. Remover os arquivos do repo (`git rm --cached` + adicionar `inspect_*.mjs`/`test_*.mjs`/`audit_*.mjs` ao `.gitignore`).
3. **Purgar o histórico** com `git filter-repo`/BFG (se o repo for público ou acessível por outras pessoas).
4. Testes devem ler credenciais de variáveis de ambiente, nunca hardcoded.

### C2. Endpoint de cron com SERVICE KEY sem autenticação — escrita total sem login
`api/cron/finalize-locacoes.mjs` (exposto publicamente via `vercel.json` rewrite):
- Só exige `POST` — **qualquer pessoa** que descubra `https://<projeto>.vercel.app/api/cron/finalize-locacoes` dispara a rotina.
- Usa `SUPABASE_SERVICE_KEY` (linha 11) — **ignora RLS**, atualiza `locacoes` e `veiculos` em massa.
- Observação: o `.env` define `SUPABASE_SERVICE_ROLE_KEY` (nome diferente). Ou seja: **ou o cron está quebrado (500 todo dia às 05:00) ou, se a env existir com o nome errado no Vercel, é um buraco de segurança explorável.**

**Correção:**
1. Validar o header `x-vercel-cron` (padrão oficial da Vercel) e rejeitar 401 sem ele — ou exigir um `CRON_SECRET` via `Authorization: Bearer`.
2. Usar `SUPABASE_SERVICE_ROLE_KEY` (nome correto) **ou** anon + RLS com política de update restrita.
3. Nunca expor service key em função alcançável publicamente.

### C3. Salvar vistoria é um no-op silencioso (funcional)
`VistoriaForm.tsx:456` chama `mutate('/api/vistorias', ...)` do hook `useMutation` (`useApi.ts`), mas esse hook **só trata** `/api/veiculos`, `/api/clientes` e `/api/locacoes` — para `/api/vistorias` ele retorna `null` (linha 671) sem erro. O formulário "funciona", mas **nenhuma vistoria é gravada** (sem alerta, sem erro visível). Checklist, fotos, avarias e assinaturas se perdem.
Complemento: as assinaturas são enviadas sempre vazias (`assinaturaClienteUrl: ''`, `assinaturaVistoriadorUrl: ''` em `VistoriaForm.tsx:446-447`) — o fluxo de assinatura nunca captura nada no caminho ativo.

**Correção:** implementar o branch `/api/vistorias` no `useMutation` (usando Supabase direto, como os demais) ou substituir o submit por chamada Supabase com RPC; habilitar captura de assinatura de verdade.

### C4. Sessão/role forjável no localStorage + cache com PII compartilhado entre usuários
- **Role forjável:** `AuthContext.tsx:31-45` lê `oliveira_auth_session` do localStorage sem validar; `:134-140` só reseta o estado se **não** houver `stored.user` — um visitante pode escrever `{user:{...}, role:"admin"}` no devtools e abrir toda a UI de gestão (os guards de `App.tsx:47-62` passam). As queries ao vivo ficam limitadas pela RLS (sem JWT real), mas o cache abaixo é renderizado sem nenhuma rede, e qualquer brecha de RLS vira exposição real.
- **Cache compartilhado:** `useApi.ts:319-357` grava tudo que as queries retornam em `oliveira_cache_*` **sem identidade de usuário na chave**, incluindo `/api/clientes` (CPF, `:229`), `/api/locacoes` (`:213`) e `/api/movimentacoes_financeiras` (`:297`). Um cliente que usar o mesmo navegador após um funcionário vê CPFs e financeiro da sessão anterior instantaneamente; o dado bruto fica no dispositivo mesmo após logout.

**Correção:** revalidar via `supabase.auth.getUser()` antes de aceitar estado local; derivar `role` só do servidor (`perfis`); namespace do cache por `user.id`; não cachear dados sensíveis; limpar `oliveira_cache_*` no logout.

---

## 🟠 ALTO (corrigir o quanto antes)

### A1. 71 vulnerabilidades de dependências (3 críticas, 36 altas)
`npm audit` (26/08/2026):
- **Diretas:** `hono@4.7.7` (fixado — ~18 advisories, incl. CORS `ACAO:*`+credentials e ReDoS), `postcss@8.5.x` (path traversal / leitura de arquivos), `vite@6.3.2` (file read no dev server), `wrangler` (command injection em `pages deploy`), `@capacitor/cli → tar` (críticas: DoS/arbitrary file overwrite).
- **Transitivas:** `undici`, `ws`, `minimatch`, `picomatch`, `nanoid`, `js-yaml`, `tar`, etc.
- `hono` está fixado em `4.7.7` no `package.json` (linha 16) sem `^`, o que impede atualização automática.

**Correção:** `npm audit fix` para as transitivas; atualizar `hono` (4.12.34+), `vite` (6.4.2+/6.5.x), `postcss` (8.5.23+), `wrangler` (4.59.1+), `@capacitor/cli`; revisar se `hono`/`wrangler` ainda são necessários (o app usa Supabase, não Cloudflare — provável resíduo).

### A2. API serverless 100% pública — proteção depende só de RLS
Nenhum handler valida o JWT do usuário; todos criam client com **chave anon** sem repassar o `Authorization`:
- Com RLS ativo: as páginas que usam `fetch('/api/...')` recebem **dados vazios** — feature quebrada.
- Sem RLS ativo no banco (ou com policy permissiva residual): **qualquer pessoa com a URL lê CPFs, dados financeiros e manipula registros** — exposição total.
- `src/api-handlers/supabaseClient.mjs` é código morto que **prioriza service role key** (linha 5) — se qualquer handler passar a usá-lo com a env setada, toda a RLS é anulada.

**Correção:** middleware de auth no `api/index.mjs` (validar JWT e exigir papel autenticado, exceto rotas públicas como catálogo); excluir/neutralizar `supabaseClient.mjs`; padronizar o frontend em chamadas Supabase diretas (que já respeitam RLS).

### A3. Módulos quebrados por `fetch('/api/...')` em produção
O app é SPA e `useApi` apenas intercepta strings `/api/...` no cliente; `fetch()` reais para `/api/...`:
- **No app Android (Capacitor):** apontam para `https://localhost` (webview) → **404 — CRUD de Manutenção, todo o módulo de Vistorias e o relatório de despesas não funcionam** (`Manutencao.tsx:185-236`, `VistoriaForm.tsx:80,170,192,220,238,262,287`, `VistoriaDetalhes.tsx:53,72`, `ChecklistDashboard.tsx:26`, `Relatorios.tsx:162-164,564`).
- **Na web (Vercel):** alcançam os handlers, mas rodam como `anon` → RLS devolve vazio (dados não carregam) ou, sem RLS, expõem dados.
- `finalizar-locacao-vistoria.mjs` não está no switch do router (`api/index.mjs`) → **404 sempre**; `Checklist.tsx` e `VistoriaComparacao.tsx` nem têm rota no `App.tsx` (código morto).

**Correção:** substituir por chamadas Supabase diretas/RPCs (respeitam RLS e funcionam no Android) ou remover código morto; unificar o acesso em `useApi`.

### A4. `perfis.role` gravado pelo cliente — risco de escalada condicionado à RLS
`MeuPerfil.tsx:167-173` faz `supabase.from('perfis').upsert([{..., role, ativo:true}])` com `role` vindo do contexto (client-side); `AuthContext.tsx:271-293` e `Configuracoes.tsx:133-135` inserem perfis com role definido no cliente. Para o usuário editar o próprio perfil, a RLS precisa permitir update/insert na própria linha — **se a policy não restringir a coluna `role`, qualquer cliente grava `role:'admin'` e o `is_staff()` do banco passa a retornar true** (escalada total, não só de UI).
**Correção:** definir `role` exclusivamente por trigger/RPC no servidor; remover `role` do payload do cliente; policy que bloqueie alteração de `role` pelo usuário final.

### A5. RENAVAM (documento do veículo) exposto no catálogo público
`CatalogoCliente.tsx:107-123` e `:85` fazem `supabase.from('veiculos').select('*')` — página pública (sem login). Como o RLS precisa abrir `veiculos` ao anon para o catálogo funcionar, **qualquer visitante lê o renavam da frota inteira**.
**Correção:** view pública sem `renavam` (e sem `valor_veiculo`/`fotos` se não forem necessários) ou `select` explícito de colunas.

### A6. Drift de schema no Supabase (`clientes`, `vistorias`, políticas)
- `clientes`: `supabase_schema.sql`/`COLAR_NO_SUPABASE.sql` criam `cpf`; `ADICIONAR_CNPJ_CLIENTES.sql` (que é script **Neon**, provedor errado!) renomeia para `cpf_cnpj`; `SUPABASE_SECURITY_RLS.sql` adiciona `documento`+`tipo_documento`. O código detecta a coluna em runtime (`clientes.mjs` `detectColumns`) — schema instável.
- `vistorias`: dois schemas conflitantes — `migrations/4.sql` (UUID, não executa: usa `trigger_set_timestamp()` e `uuid_generate_v4()` sem criar, FK UUID vs `clientes.id SERIAL`) vs `CRIAR_TABELA_VISTORIAS.sql` (SERIAL, colunas `item_*`, usado pelo app).
- `CRIAR_TABELA_MANUTENCOES.sql` cria política `FOR ALL USING (true)` — **acesso anônimo a manutenções** se o script de segurança não rodar depois.
- `COLAR_NO_SUPABASE.sql` habilita RLS sem criar nenhuma política ("políticas seguras" é enganoso — tudo fica bloqueado).

**Correção:** consolidar **um** script de schema idempotente + **um** script de políticas RLS (o `SUPABASE_SECURITY_RLS.sql` é bom — executá-lo por último); descartar `migrations/4.sql` e o script Neon; corrigir a política de manutenções.

### A7. Vazamento de detalhes internos em respostas de erro
Todos os handlers respondem `details: error.message` (ex.: `api/index.mjs:122`, `clientes.mjs:227`, `vistorias.mjs:353`, `cron:66`), expondo nomes de tabelas/colunas e mensagens de RLS do PostgREST — facilita reconhecimento do banco.
**Correção:** logar no servidor; responder mensagem genérica; mapear códigos conhecidos (PGRST116 etc.) para status corretos.

### A8. CORS inconsistente
`api/index.mjs` monta allowlist de origens, mas **cada handler sobrescreve `Access-Control-Allow-Origin: *`** enquanto `Allow-Credentials: true` permanece (combinação inválida/indesejada). A allowlist aceita substring (`*.vercel.app`, `includes(...)`) → origens falsas passam.
**Correção:** centralizar CORS no router, allowlist por hostname exato, nunca `*` com credentials.

### A9. Falta de validação/mass assignment na API
- `veiculos.mjs:54` e `movimentacoes.mjs:40,46` inserem/atualizam com o body inteiro — cliente pode forjar colunas (`id`, `locacao_id`, `tipo`, valores).
- Filtros `.or()`/`ilike` com entrada do usuário sem escape (`veiculos.mjs:37,49`, `clientes.mjs:125`) — injeção de predicado PostgREST.
- IDOR: PUT/DELETE por ID sem checagem de permissão (mitigado por RLS hoje).
- Sem rate limiting.

**Correção:** whitelist de campos, validação de tipos/enums, escape de filtros, rate limiting.

### A10. Fallback local de locação não-transacional + datas inválidas aceitas
`useApi.ts:513-605` (fallback de `criar_locacao`): não valida `data_entrega >= data_locacao`; insert da locação, update do veículo e lançamentos financeiros são passos separados — se um falha, fica veículo `locado` sem lançamento; `:632-637` só libera o veículo se `vars.veiculo_id` existir, e `Locacoes.tsx:175-184` finaliza enviando **apenas** `{status:'finalizada'}` → **no fallback o veículo nunca é liberado**. `Locacoes.tsx:601-609` deixa `valor_total` editável manualmente — permite salvar locação com datas invertidas.
**Correção:** exigir as RPCs `criar_locacao`/`atualizar_locacao` (transacionais, já existem e são bem feitas); validar datas no cliente; recalcular/desabilitar `valor_total` quando há diárias e datas.

---

## 🟡 MÉDIO

- **M1. ProGuard desabilitado em release** (`android/app/build.gradle:41` `minifyEnabled false`) — APK reversível, chave anon e lógica expostas. Habilitar com regras p/ Capacitor.
- **M2. Scripts SQL destrutivos:** `CORRIGIR_TABELAS_SUPABASE.sql` usa `DROP TABLE CASCADE` e `DISABLE RLS` sem proteção; `migrations/1.sql` é SQLite (`AUTOINCREMENT`) num projeto Postgres — pasta `migrations` é legado.
- **M3. Chave anon hardcoded no fonte** (`supabase.ts:4`, `supabaseClient.mjs:5`) — anon é pública por design, mas o fallback mascara env ausente e dificulta rotação; remover fallback.
- **M4. `audit_play_store.mjs` desatualizado** (espera v2.5.7/versionCode 33; atual é 2.6.6/42).
- **M5. Docs divergentes:** `INSTRUCOES_DEPLOY.md` (Netlify + política `USING (true)` rotulada dev-only), `VERCEL_DEPLOYMENT.md` (Node 20 vs engines 22.x), README (Cloudflare D1 — resíduo; o app usa Supabase).
- **M6. Pasta duplicada `Contrato LocaÃ§ao/`** (nome com mojibake "Ã§") com 33 arquivos versionados — cópia de recursos Android/imagens. Remover do repo e do disco. Pastas `Locaçao/` e `Mocha/` vazias no workspace.
- **M7. Fotos em base64 no banco** (`PhotoCapture.tsx:92` `toDataURL`, salvas como JSON na coluna `fotos`; `Veiculos.tsx:329-338` `foto_principal` base64) — infla o banco, o cache e o tráfego; usar Storage do Supabase + URLs.
- **M8. `console.log` de PII/dados em produção** (`veiculos.mjs:28-113`, `locacoes.mjs`, `locacoes-id.mjs`, `vistorias-id.mjs`) — volume alto em logs da Vercel.
- **M9. Cron com fuso UTC** (`cron:20` usa `toISOString()` UTC vs. horário local MS) + `.lt` estrito — locações do dia corrente não são finalizadas.
- **M10. Fuso horário no frontend:** `Relatorios.tsx:288-311` interpreta datas `'yyyy-mm-dd'` como UTC meia-noite — agrupamento financeiro desloca o 1º dia para o mês anterior; `Locacoes.tsx:41` usa UTC para "hoje" enquanto `useApi.ts:133` usa local — critérios divergentes. Centralizar em `formatters.ts`.
- **M11. Reserva aceita datas invertidas** (`CatalogoCliente.tsx:139-150` usa `Math.abs(fim - inicio)`; `Reservas.tsx:146-155` força `Math.max(1,...)`): cliente pode reservar com `data_fim < data_inicio` e o valor é calculado errado. Validar antes do submit.
- **M12. Falso sucesso de cadastro de cliente** (`CatalogoCliente.tsx:187-197`): no erro do banco exibe "Cadastro realizado com sucesso!".
- **M13. Assinatura nunca capturada + fotos não serializáveis:** `VistoriaForm.tsx:446-448` envia `File` objects (viram `{}` no JSON); a tela com `SignatureCanvas` (`Checklist.tsx:804-809`) não está roteada.
- **M14. `allowBackup="true"` no AndroidManifest** — dados locais (sessão) podem ir para backup na nuvem; avaliar `false`.
- **M15. Duplicação de código:** `detectColumns` duplicado em `clientes.mjs`/`locacoes.mjs`; GET/PUT/DELETE de vistorias em `vistorias.mjs` e `vistorias-id.mjs`; N+1 em `vistorias.mjs:80-95`; formatação de data/CPF reimplementada em cada página apesar de existir `utils/formatters.ts`.
- **M16. ESLint ignora `*.mjs`/`*.js`/`api/**`** (`eslint.config.js:18-22`) — a camada de API e os scripts de teste ficam sem lint (foi por isso que as senhas passaram despercebidas).
- **M17. `useApi`: `abortRef` nunca usado; setState após unmount; refetches concorrentes** (`useApi.ts:368,393-422`).
- **M18. Vistorias "pendentes" detectadas por `nome_vistoriador === 'Sistema'`** (`ChecklistDashboard.tsx:33-37`) — classificação frágil.

---

## 🟢 BAIXO

- **B1.** `dashboard.mjs:24-28` expõe nomes de envs em resposta de erro.
- **B2.** 404 lista `availableEndpoints` (`api/index.mjs:107-115`).
- **B3.** Política `veiculos` referencia status `'excluido'` que o CHECK do schema não permite.
- **B4.** `og:url` é `#` e favicon/og:image apontam para CDN externo (`mocha-cdn.com`) em `index.html` — dependência de terceiro para assets.
- **B5.** `MASTER_ADMIN_EMAILS` hardcoded no frontend (`AuthContext.tsx:59-63`) + role por e-mail com `includes` (`:97`) — usar sempre igualdade estrita e a tabela `perfis` como fonte única.
- **B6.** Impressão de contrato via `document.write`/`innerHTML` (`Locacoes.tsx:352-412`) — usar CSS `@media print`.
- **B7.** QR Code PIX gerado por serviço de terceiros (`PixModal.tsx:51-53` → `api.qrserver.com`) — gerar localmente.
- **B8.** Busca de veículos na tela de frota sem efeito (`Veiculos.tsx:46-50` — `executeSupabaseQuery` ignora `search`).
- **B9.** Erros ignorados em mutações otimistas (`Reservas.tsx:89-100`, `Configuracoes.tsx:101-111,133-143`).

---

## ✅ O que está OK (verificado)

- **Build:** `tsc --noEmit` strict passa sem erros; ESLint limpo; `dist/` gerado.
- **Segredos:** `.env`/`.env.local` **não** estão no git; **service role key nunca foi commitada** (verificado em todo o histórico); `key.properties`/`*.jks` fora do git; `APP_GERADO_PLAY_STORE/` ignorada.
- **RLS final** (`SUPABASE_SECURITY_RLS.sql`): design sólido — papéis anon/authenticated, `is_admin()`/`is_staff()` seguros (SECURITY DEFINER + `SET search_path`), RPCs transacionais (`criar_locacao` com overlap check + vistoria inicial automática), catálogo público restrito a `veiculos`.
- **Android:** applicationId/namespace consistentes (`com.locadoraoliveira.app`); `usesCleartextTraffic=false` + `androidScheme:https`; permissões mínimas (INTERNET/network); FileProvider `exported=false`; apenas MainActivity exportado; minSdk 22 / targetSdk 36.
- **Rotas do frontend:** páginas de staff/admin protegidas por guardas (com a ressalva de C4).
- **Login:** usa `signInWithPassword` real do Supabase (sem credenciais falsas locais); remoção de resíduo de senha antiga (`oliveira_auth_vault`).

---

## 🛠️ Plano de ação priorizado

**Semana 1 (crítico):**
1. Rotacionar senhas (admin/funcionário/cliente) e remover arquivos com credenciais do git + purgar histórico.
2. Proteger o cron (`x-vercel-cron` + `CRON_SECRET`) e corrigir o nome da env (`SUPABASE_SERVICE_ROLE_KEY`); se a rotina não for necessária, desativar o cron no `vercel.json`.
3. Corrigir o no-op de vistorias no `useMutation` (ou migrar para RPC).
4. Corrigir sessão forjável/cache PII no localStorage (revalidação + namespace por usuário).
5. `npm audit fix` + atualizar `hono`, `vite`, `postcss`, `wrangler`, `@capacitor/cli`.

**Semana 2 (alto):**
6. Middleware de auth na API + neutralizar `supabaseClient.mjs`; remover `details` de respostas de erro.
7. Consolidar schema/políticas SQL (um script idempotente executado por último); descartar `migrations/4.sql` e script Neon.
8. Corrigir fetch('/api/...') no Android (migrar para Supabase direto/RPCs); CORS centralizado; validação/mass assignment; rate limiting.
9. Restringir `perfis.role` (servidor) e `renavam` no catálogo.

**Semana 3 (médio/baixo):**
10. ProGuard em release; fotos para Storage; fuso horário; validação de datas; limpeza de docs, pastas duplicadas, logs e código morto.

---

## 🔎 Verificações pendentes (que precisam de acesso externo)

- Confirmar **se a RLS está ativa no banco de produção** (rodar `test_anon_queries.mjs`/`inspect_rls.mjs` **sem** as senhas hardcoded) — define se a exposição A2 é "feature quebrada" ou "dados vazando".
- Confirmar se o repositório `odairorso/locadoraoliveira` é **público** (se sim, o histórico com senhas está exposto hoje).
- Confirmar se o Vercel tem `SUPABASE_SERVICE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` setadas.
- Confirmar se as RPCs `criar_locacao`/`atualizar_locacao`/`excluir_locacao` foram executadas no banco (o fallback local do frontend sugere que podem não estar).
