# 📱 Guia de Publicação na Google Play Store & Testes Locais - Oliveira Veículos

Este guia contém o passo a passo completo para testar o sistema localmente e compilar o aplicativo oficial da **Oliveira Veículos** para a **Google Play Store**.

---

## 🚀 1. Passo Inicial: Atualizar o Banco de Dados no Supabase

Antes de testar, execute o script de atualização do banco de dados:

1. Acesse o **SQL Editor** do seu projeto no Supabase:
   👉 [https://supabase.com/dashboard/project/uvqyxpwlgltnskjdbwzt/sql/new](https://supabase.com/dashboard/project/uvqyxpwlgltnskjdbwzt/sql/new)
2. Abra o arquivo [UPGRADE_APP_ANDROID.sql](file:///c:/Users/Odair/Documents/Contrato%20Loca%C3%A7ao/UPGRADE_APP_ANDROID.sql) deste projeto.
3. Copie todo o conteúdo, cole no SQL Editor do Supabase e clique em **Run**.
4. Isso criará:
   - Suporte a fotos e opcionais na tabela `veiculos`.
   - Tabela de `perfis` (com permissão de Admin para `veiculos.oliveira@gmail.com`).
   - Tabela de `configuracoes_empresa` (com sua Chave PIX e WhatsApp).
   - Tabela de `solicitacoes_reserva` (para receber os pedidos dos clientes via app/link).

---

## 💻 2. Como Testar o App Localmente

### Teste no Navegador (Web & Mobile)
Para rodar o sistema localmente:
```bash
npm run dev
```
- Acesse `http://localhost:5173`.
- Pressione `F12` no teclado e clique no ícone de celular (Modo Responsivo) para simular exatamente a tela do aplicativo Android.
- Teste os diferentes modos usando o seletor na barra lateral ou no menu:
  - 👑 **Modo Dono / Admin**: Acesso total ao faturamento, relatórios, gestão de veículos e PIX.
  - 👔 **Modo Funcionário**: Acesso a locações, vistorias/checklists e cadastro de clientes.
  - 🚗 **Modo Cliente**: Visualização do catálogo de carros disponíveis, simulação de locação e botão para Copiar o PIX.

---

## 📲 3. Compilando o App para Android (APK e Play Store)

O projeto está configurado com o **Capacitor**, que transforma a aplicação web em um app nativo Android (`com.locadoraoliveira.app`).

### Pré-requisitos:
- [Android Studio](https://developer.android.com/studio) instalado no computador.
- Node.js instalado.

### Passo a Passo de Compilação:

1. **Gerar a versão de produção (Build web)**:
   ```bash
   npm run build
   ```

2. **Adicionar a plataforma Android (apenas na primeira vez)**:
   ```bash
   npx cap add android
   ```

3. **Sincronizar os arquivos com o projeto Android**:
   ```bash
   npm run cap:sync
   ```

4. **Abrir o projeto no Android Studio**:
   ```bash
   npm run cap:open
   ```

5. **Gerar o APK de Teste (para instalar direto no seu celular)**:
   - No Android Studio, vá no menu superior: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
   - Ao terminar, clique no link `locate` para pegar o arquivo `app-debug.apk` e envie para o seu WhatsApp/Celular para testar e instalar.

6. **Gerar o Pacote (.AAB) para a Google Play Store**:
   - No Android Studio, vá em: `Build > Generate Signed Bundle / APK`.
   - Selecione **Android App Bundle (.aab)** e clique em Next.
   - Clique em **Create new...** para criar sua chave de assinatura (Keystore) segura (guarde a senha e o arquivo `.jks` com cuidado!).
   - Selecione a variante de build **release** e clique em **Create**.
   - O Android Studio gerará o arquivo `.aab` pronto para envio no Google Play Console.

---

## 🏪 4. Publicando no Google Play Console

1. Acesse o [Google Play Console](https://play.google.com/console).
2. Clique em **Criar app**:
   - **Nome do app**: `Oliveira Veículos`
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: Gratuito
3. Preencha as seções obrigatórias da Play Store:
   - **Política de Privacidade**
   - **Acesso ao app**: Todo o app está disponível sem restrições / fornecer login de teste se solicitado
   - **Classificação de Conteúdo**: Livre (L)
   - **Público-alvo**: A partir de 18 anos
4. **Ficha da Loja Principal**:
   - **Descrição curta**: *Alugue carros revisados com o melhor preço e rapidez na Oliveira Veículos.*
   - **Descrição completa**: *Aplicativo oficial da Oliveira Veículos em Naviraí - MS. Consulte os veículos disponíveis em tempo real, veja fotos, valores de diárias, faça sua reserva e pague com praticidade via PIX!*
   - Adicione o ícone do app (512x512 px) e prints da tela do catálogo.
5. **Upload do App**:
   - Vá em `Produção > Criar nova versão`.
   - Faça upload do arquivo `.aab` gerado no Android Studio.
   - Envie para análise do Google. Após a aprovação (normalmente de 2 a 5 dias úteis), seu aplicativo estará disponível para todos baixarem diretamente na Google Play Store!

---

## 🔗 5. Como Compartilhar com os Clientes

Assim que o app estiver publicado (ou usando o site web):
- Você ou seus funcionários podem abrir qualquer carro no painel ou no catálogo e clicar no botão **"Compartilhar Link"**.
- O sistema já gera uma mensagem formatada com o link do carro e o link para download na Google Play Store, pronta para enviar no WhatsApp do cliente com 1 clique!
