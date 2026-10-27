# O Analista Finanças — Guia de Instalação Completo

Este guia assume que você nunca configurou nada disso antes. Siga cada etapa na ordem.

---

## O que você vai configurar

| Serviço          | Para que serve                        | Custo           |
|------------------|---------------------------------------|-----------------|
| GitHub           | Guardar e versionar o código          | Grátis          |
| Cloudflare Pages | Colocar o site no ar                  | Grátis          |
| Supabase         | Banco de dados (usuários, compras)    | Grátis          |
| Brevo            | Enviar o e-mail de acesso ao cliente  | Grátis (300/dia)|
| Mercado Pago     | Receber pagamentos (PIX e cartão)     | % por venda     |

Tempo estimado: 45–60 minutos na primeira vez.

---

## Etapa 1 — GitHub (já feito)

Você já criou a conta, instalou o GitHub Desktop e fez upload dos arquivos. Pule para a Etapa 2.

---

## Etapa 2 — Supabase (banco de dados)

O Supabase é onde ficam armazenados os dados: e-mails dos clientes, quais ebooks cada um comprou, os tokens de acesso e as sessões.

### 2.1 Criar a conta

1. Acesse **supabase.com**
2. Clique em **Start your project** no topo da página
3. Clique em **Continue with GitHub** — use a mesma conta do GitHub que você criou
4. Autorize o acesso quando pedir

### 2.2 Criar o projeto

1. Após entrar, clique no botão verde **New project**
2. Se pedir para escolher uma organização, selecione a que aparecer (geralmente seu nome de usuário)
3. Preencha os campos:
   - **Name:** `o-analista-financas`
   - **Database Password:** crie uma senha forte (ex: `OAnalista@2024!`). **Guarde essa senha**, vai precisar dela
   - **Region:** selecione **South America (São Paulo)**
4. Clique em **Create new project**
5. Aguarde cerca de 1 a 2 minutos. Uma barra de progresso vai aparecer — espere até sumir

### 2.3 Criar as tabelas do banco

1. No menu lateral esquerdo, procure e clique em **SQL Editor** (ícone que parece um banco de dados)
2. Vai abrir uma tela com uma área de texto
3. Abra o arquivo `schema.sql` que está dentro do zip que você extraiu. Pode abrir com o Bloco de Notas (clique com botão direito → Abrir com → Bloco de Notas)
4. Seleciona todo o conteúdo com `Ctrl + A` e copia com `Ctrl + C`
5. Volta no Supabase, clica na área de texto do SQL Editor e cola com `Ctrl + V`
6. Clique no botão verde **Run** no canto superior direito da área de texto
7. Embaixo deve aparecer uma mensagem de sucesso. Se aparecer um erro, me manda uma foto que verifico

### 2.4 Pegar as chaves de acesso

Agora você precisa copiar duas informações que o site vai usar para se conectar ao banco.

1. No menu lateral esquerdo, clique em **Project Settings** (ícone de engrenagem, geralmente no final do menu)
2. No submenu que abrir, clique em **API**
3. Você vai ver a seção **Project URL** — copie o endereço que aparece ali (começa com `https://` e termina com `.supabase.co`). Cole num bloco de notas por enquanto
4. Role a página um pouco para baixo até ver a seção **Project API Keys**
5. Ali tem duas chaves: `anon public` e `service_role`. Você precisa da **service_role**
6. Clique em **Reveal** ao lado dela para mostrar o valor completo
7. Copie essa chave e cole também no bloco de notas

> ⚠️ Não compartilhe a `service_role` com ninguém — ela dá acesso total ao banco.

---

## Etapa 3 — Brevo (envio de e-mail)

O Brevo vai enviar o e-mail com o link de acesso para cada cliente que comprar.

### 3.1 Criar a conta

1. Acesse **brevo.com**
2. Clique em **Sign up free** no topo
3. Cadastre-se com seu Gmail normalmente
4. Confirme o e-mail que eles enviarem

### 3.2 Pegar a chave de API

1. Após entrar, clique no seu nome/foto no canto superior direito
2. Clique em **SMTP & API** no menu que abrir. Alternativamente procure por **Settings → API Keys** no menu lateral
3. Clique em **Generate a new API key**
4. Dê o nome `o-analista-financas`
5. Clique em **Generate**
6. Vai aparecer a chave — copie ela agora e cole no bloco de notas. **Ela não vai aparecer de novo depois que você fechar.**

### 3.3 Adicionar o e-mail remetente

O Brevo precisa saber de qual e-mail os seus clientes vão receber as mensagens.

1. No menu lateral, procure por **Senders & IP** ou **Senders**
2. Clique em **Add a new sender**
3. Preencha:
   - **From name:** `O Analista Finanças`
   - **From email:** coloque o Gmail que você criou para o canal (ex: `oanalistafinancas@gmail.com`)
4. Clique em **Save**
5. O Brevo vai enviar um e-mail de confirmação para esse Gmail — abra o Gmail e clique no link de confirmação

---

## Etapa 4 — Mercado Pago (pagamentos)

### 4.1 Acessar o painel de desenvolvedores

1. Entre na sua conta do Mercado Pago normalmente
2. Acesse **mercadopago.com.br/developers/panel**
3. Se pedir para aceitar os termos de desenvolvedor, aceite

### 4.2 Criar o aplicativo

1. Clique em **Criar aplicação** ou **+ New application** (pode variar dependendo do visual do painel)
2. Preencha:
   - **Nome do aplicativo:** `O Analista Finanças`
   - **Finalidade:** marque **Processar pagamentos online**
   - **Modelo de integração:** marque **Checkout API**
3. Complete o CAPTCHA se aparecer
4. Clique em **Criar aplicação**

### 4.3 Pegar o Access Token

1. Após criar, você vai cair dentro do aplicativo
2. Procure a aba ou seção chamada **Credenciais de produção**
3. Ali vai ter um campo **Access Token** — começa com `APP_USR-`
4. Copie e cole no bloco de notas

> ⚠️ Não use as credenciais de teste (Sandbox) — essas são para desenvolvimento. Use as de produção.

### 4.4 Configurar o Webhook

O webhook é o mecanismo pelo qual o Mercado Pago avisa o seu site quando um pagamento é aprovado.

1. Ainda dentro do seu aplicativo no painel MP, procure a seção **Webhooks** ou **Notificações IPN**
2. Clique em **Configurar notificações** ou **+ Adicionar URL**
3. No campo de URL, coloque por enquanto:
   `https://o-analista-financas.pages.dev/api/webhook`
   (você vai substituir pelo endereço real depois do deploy no Cloudflare)
4. Em **Eventos**, marque **Pagamentos**
5. Clique em **Salvar**
6. O painel vai mostrar uma **Chave secreta** (Webhook Secret) — copie e cole no bloco de notas

---

## Etapa 5 — Cloudflare Pages (colocar o site no ar)

### 5.1 Criar a conta

1. Acesse **cloudflare.com**
2. Clique em **Sign up** no topo
3. Cadastre-se com seu e-mail e crie uma senha
4. Confirme o e-mail se pedir

### 5.2 Criar o projeto

1. Após entrar no painel do Cloudflare, no menu lateral esquerdo procure por **Workers & Pages**
2. Clique nele e depois clique em **Create application**
3. Clique na aba **Pages**
4. Clique em **Connect to Git**
5. Clique em **Connect GitHub**
6. Uma janela vai abrir pedindo autorização — clique em **Authorize Cloudflare Pages**
7. Na tela seguinte, selecione o repositório `o-analista-financas` e clique em **Begin setup**

### 5.3 Configurar o deploy

1. Em **Project name**, deixa como está
2. Em **Production branch**, deixa `main`
3. Em **Framework preset**, selecione **None**
4. Em **Build output directory**, escreva: `public`
5. Deixe os outros campos em branco
6. Clique em **Save and Deploy**
7. Aguarde 1 a 2 minutos enquanto o deploy acontece
8. Quando terminar, vai aparecer uma URL como `o-analista-financas.pages.dev` — **anote essa URL**

### 5.4 Adicionar as variáveis de ambiente

Agora você vai dizer ao site quais são as chaves dos serviços que configurou. Tudo que você foi colando no bloco de notas vai entrar aqui.

1. Dentro do projeto no Cloudflare, clique em **Settings** no menu superior
2. Clique em **Environment Variables**
3. Clique em **Add variable** e adicione cada linha abaixo — uma de cada vez:

| Nome da variável             | Valor                                        |
|------------------------------|----------------------------------------------|
| `SUPABASE_URL`               | A URL do Supabase (começa com `https://`)    |
| `SUPABASE_SERVICE_KEY`       | A service_role key do Supabase               |
| `BREVO_API_KEY`              | A chave de API do Brevo                      |
| `SENDER_EMAIL`               | O Gmail que você cadastrou no Brevo          |
| `MERCADOPAGO_ACCESS_TOKEN`   | O Access Token do Mercado Pago               |
| `MERCADOPAGO_WEBHOOK_SECRET` | A chave secreta do webhook do MP             |
| `SITE_URL`                   | A URL do Cloudflare (ex: `https://o-analista-financas.pages.dev`) sem barra no final |

4. Após adicionar todas, clique em **Save**

### 5.5 Refazer o deploy com as variáveis

1. Clique em **Deployments** no menu superior do projeto
2. Clique nos três pontinhos `...` do deploy mais recente
3. Clique em **Retry deployment**
4. Aguarda terminar

### 5.6 Atualizar a URL no Mercado Pago

Agora que você tem a URL definitiva do site, precisa atualizar o webhook no Mercado Pago:

1. Volta em **mercadopago.com.br/developers/panel**
2. Entra no seu aplicativo
3. Vai na configuração de Webhooks
4. Troca a URL que colocou antes pela URL definitiva:
   `https://o-analista-financas.pages.dev/api/webhook`
5. Salva

---

## Etapa 6 — Testar se está funcionando

1. Abra a URL do seu site no navegador
2. Clique em um produto e tente chegar até o checkout
3. Faça um pagamento de teste com PIX (valor real, mas você pode usar R$ 1,00 ajustando o preço temporariamente)
4. Verifique se recebeu o e-mail com o link de acesso
5. Clique no link e confirme que o reader abre

---

## Problemas comuns

**O site abre mas o botão de compra não funciona**
Verifique se todas as variáveis de ambiente foram salvas corretamente no Cloudflare e se o redeploy foi feito depois de salvar.

**Não recebi o e-mail**
Verifique se o remetente foi confirmado no Brevo e se a chave de API está correta. Cheque também a pasta de spam.

**O pagamento aparece aprovado no MP mas o e-mail não chega**
O webhook pode não estar configurado corretamente. Confirme que a URL está exatamente como `https://seusite.pages.dev/api/webhook` sem barra no final.

**Aparece erro ao rodar o schema.sql**
Me manda uma foto da mensagem de erro que verifico.

---

## Recuperação de carrinho abandonado

### Como funciona
- 2 horas após um checkout não finalizado → e-mail automático de recuperação
- 7 dias sem conversão → registro apagado do banco

### Configurar o agendador (cron-job.org — gratuito)

1. Acesse **cron-job.org** e crie uma conta gratuita
2. Clique em **Create cronjob**
3. Preencha:
   - **URL:** `https://oanalista.pages.dev/api/run-recovery`
   - **Schedule:** a cada 2 horas (selecione `Every 2 hours`)
   - **Request method:** POST
4. Em **Headers**, adicione:
   - **Name:** `x-cron-secret`
   - **Value:** o mesmo valor que você colocou em `CRON_SECRET` no Cloudflare
5. Salve

### Adicionar CRON_SECRET no Cloudflare
1. Gere uma senha aleatória em **passwordsgenerator.net** (20+ caracteres)
2. Adicione no Cloudflare Pages → **Settings → Environment Variables**:
   - Nome: `CRON_SECRET`
   - Valor: sua senha gerada
3. Adicione a mesma senha no cron-job.org como header
4. Redeploy

### Executar manualmente (para testar)
Chame o endpoint com um cliente REST (Insomnia, Postman ou curl):
```
POST https://oanalista.pages.dev/api/run-recovery
Headers: x-cron-secret: sua-senha
```
