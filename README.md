# Trampo 💼 — Mural de Vagas e Oportunidades

> Plataforma fullstack open-source para comunidades do Discord publicarem **vagas de emprego** e **perfis de freelancers** de forma organizada, segura e automatizada.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E5A0?logo=postgresql)](https://neon.tech)
[![Discord](https://img.shields.io/badge/Auth-Discord_OAuth2-5865F2?logo=discord)](https://discord.com/developers)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📋 Índice

- [O que é o Trampo?](#-o-que-é-o-trampo)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e Stack](#%EF%B8%8F-arquitetura-e-stack)
- [Sistema de Segurança](#-sistema-de-segurança)
- [Sistema de Temas Visuais](#-sistema-de-temas-visuais)
- [Instalação — Método 1: Setup Wizard](#-método-1--setup-wizard-recomendado)
- [Instalação — Método 2: Manual](#%EF%B8%8F-método-2--configuração-manual-vanilla)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença e Créditos](#%EF%B8%8F-licença-e-créditos)

---

## 🎯 O que é o Trampo?

O **Trampo** é uma aplicação web que serve como mural de oportunidades para comunidades do Discord. Em vez de usar um bot ou planilha, os membros acessam um site moderno, fazem login com a conta do Discord deles e publicam vagas ou portfólios — que são enviados automaticamente para os canais corretos do servidor via Webhook.

**Pra quem é?** Qualquer dono de servidor Discord que queira organizar oportunidades de emprego e freelancers na comunidade, com moderação, controle de spam e visual personalizável.

---

## ✨ Funcionalidades

### 👥 Para Usuários
- **Login com Discord** (OAuth2 oficial — nunca acessa sua senha ou mensagens)
- **Publicar Vagas** de emprego com empresa, nível, regime e descrição
- **Publicar Perfil de Freelancer** com especialidade, skills, portfólio e formação acadêmica
- **Formulário em etapas** para guiar o preenchimento sem erros
- **Seletor de Tema Visual** — cada usuário pode escolher entre os temas criados pelo admin

### 🛡️ Para Administradores
- **Painel de Moderação** com aprovação e rejeição de vagas pendentes
- **Gerenciamento de Equipe**: promoção e remoção de moderadores (Root → Admin)
- **Sistema de Bootstrap**: o primeiro usuário a acessar o site vira Root automaticamente
- **Bypass de Rate Limit** para admins publicarem vagas ilimitadas
- **Editor de Temas Visuais** com preview em tempo real
- **Editor de Opções do Formulário**: personaliza os níveis, regimes, faculdades, cursos e formações que aparecem no formulário de publicação — com tags visuais, reset para padrão e salvamento por categoria
- **Sistema de Anúncios**: cadastro, edição e remoção de banners/links patrocinados exibidos no site, com contador de cliques

### 🎨 Sistema de Temas (Admin)
- **3 slots de tema** salvos no banco de dados
- Personalização de: 5 cores principais, GIF/imagem de fundo, blur do fundo, gradientes radiais com posição e opacidade
- **Preview em tempo real** via iframe sem afetar o site público
- **Salvar mundialmente** atualiza o visual para todos os usuários instantaneamente (sem redeploy)
- Usuários podem escolher seu tema preferido individualmente

### 📢 Sistema de Anúncios
- **Gerenciamento pelo painel admin**: crie e remova anúncios com imagem ou texto
- **Dois formatos**: banner horizontal (topo do conteúdo) e banner flutuante (canto inferior direito)
- **Fallback automático**: se não houver anúncio ativo, exibe um link de convite para o Discord da comunidade
- **Contador de cliques**: rastreamento anônimo via `sendBeacon` — sem bloquear a navegação
- **Anti-adblock**: tráfego pela própria rota `/api/ads` — sem dependência de redes externas

### 🤖 Integração Discord
- Envio automático para **Webhooks** configurados por tipo (vagas/freelancers)
- Mensagens formatadas com **embed rico** e menção ao usuário
- **Sanitização anti-ping**: `@everyone` e `@here` são bloqueados automaticamente
- Remoção de menções injetadas `<@userId>` e links de canal `<#channelId>`

### 🚦 Anti-Spam e Rate Limits
- Máximo de **3 vagas diretas por mês** para usuários comuns — excedente vai para moderação.
- **30 dias de cooldown** entre publicações de perfil freelancer para usuários comuns.
- **Administradores não possuem cooldown** e podem publicar ilimitadamente, contornando a moderação.
- Rate limit de **20 buscas por minuto** no painel de moderação (por IP).
- **Anti-ping** (no Discord): `@everyone`, `@here` e menções de usuário são sanitizados antes do envio.

---

## 🏗️ Arquitetura e Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário / Admin                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│              Next.js 16 App Router (Vercel)                  │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Server Components│  │    API Routes (Route Handlers)   │  │
│  │  ThemeProvider  │  │  /api/discord  /api/admin/*      │  │
│  │  AdminPage      │  │  /api/theme/*  /api/auth/*       │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           proxy.js (Next.js Middleware)                  │ │
│  │   Setup Wizard ↔ App Router ↔ Setup API lockdown        │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────────────┬────────────────────────┘
           │ Prisma v7 + pg           │ fetch (Webhook)
┌──────────▼──────────┐  ┌───────────▼──────────────────────┐
│  PostgreSQL (Neon)  │  │    Discord API (Webhooks)         │
│  Users / JobPosts   │  │    Canal Vagas / Canal Freelas    │
│  Admins / Themes    │  └──────────────────────────────────┘
│  UserPreferences    │
└─────────────────────┘
```

### Stack Completa

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Framework | **Next.js 16.2** App Router | Server Components + API Routes em um só lugar |
| UI | **React 19.2** + Vanilla CSS Modules | Performance máxima, sem CSS-in-JS |
| Banco de Dados | **PostgreSQL via Neon DB** | Serverless, gratuito, alta performance |
| ORM | **Prisma v7** + `@prisma/adapter-pg` | Type-safe, migrations automáticas |
| Autenticação | **NextAuth.js** Discord Provider | Cookies HttpOnly nativos, anti-CSRF |
| Validação | **Zod** | Schema de validação em runtime para todas as APIs |
| Deploy | **Vercel** | SSR + Edge Middleware + CI/CD automático |

---

## 🔒 Sistema de Segurança

O Trampo foi construído com segurança em camadas. Aqui está o que protege você e seus usuários:

### 🍪 Cookies HttpOnly (Sessão Segura)
O NextAuth.js armazena os tokens de sessão em **cookies HttpOnly + Secure + SameSite=Lax**. Isso significa que nenhum JavaScript rodando no navegador consegue ler ou roubar o token do usuário — blindagem total contra ataques XSS de roubo de sessão.

### 🔐 Variáveis de Ambiente Server-Only
Todas as chaves sensíveis (`DATABASE_URL`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `DISCORD_WEBHOOK_URL_*`) **não têm o prefixo `NEXT_PUBLIC_`**. O Next.js garante que elas nunca chegam ao bundle do cliente — são fisicamente removidas na compilação.

### 🧱 Proteção CSRF nas Rotas Admin
As rotas de ação administrativa (`/api/admin/action`, `/api/admin/promote`, `/api/admin/demote`) validam os cabeçalhos `Origin` e `Referer` de cada requisição via `src/lib/csrf.js`. Uma requisição de outro site (mesmo com a sessão do admin) é bloqueada com 403.

> **Por que isso importa?** Sem essa proteção, um link malicioso enviado no Discord poderia fazer um admin aprovar vagas de spam ou promover um hacker — apenas clicando no link.

### 🛡️ Proteção SSRF no Setup
O endpoint `/api/setup/validate` — que testa conexões de banco de dados — bloqueia conexões para IPs privados e reservados:
- `127.x.x.x` (loopback)
- `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x` (RFC1918)
- `169.254.169.254` (**AWS/GCP metadata** — o mais crítico)
- IPv6 privados (`::1`, `fc00::`, `fd::/8`)

Webhooks só são aceitos se o domínio for exatamente `discord.com`.

### 🔒 Lockdown do Setup em Produção
Uma vez que o sistema está configurado (`DATABASE_URL` + `NEXTAUTH_SECRET` presentes), o `proxy.js` bloqueia **toda** a rota `/api/setup/*` com 403. O wizard de configuração literalmente desaparece em produção — ninguém consegue sobrescrever seu `.env` remotamente.

### 💉 Proteção contra CSS Injection
O editor de temas salva configurações no banco de dados. Na hora de gerar o CSS:
1. **Na escrita** (`theme.service.js`): todos os valores são validados por regex antes de salvar no banco.
2. **Na leitura** (`lib/theme-css.js`): os valores do banco são **re-validados** antes de injetar no `<style>`. O banco é tratado como "não confiável".

Isso previne que dados corrompidos no banco quebrem o layout ou injetem código nos usuários.

### 🚦 Rate Limiting
- **Por negócio** (no banco): limite de vagas mensais e cooldown de freelancers por conta Discord
- **Por IP** (em memória): 20 requisições/minuto no endpoint de busca de usuários do painel admin
- **Anti-ping** (no Discord): `@everyone`, `@here` e menções de usuário são sanitizados antes do envio

### ✅ Validação Zod em Toda API
Todas as rotas de API validam o payload com schemas Zod antes de qualquer operação. Campos extras são ignorados, tipos incorretos geram 400 antes de chegar ao banco.

---

## 🎨 Sistema de Temas Visuais

### Como Funciona (Sem Redeploy)
O sistema de temas **não sobrescreve arquivos CSS**. Em vez disso:

1. O Admin cria e salva um tema no banco de dados (PostgreSQL/Neon)
2. Quando qualquer usuário acessa o site, o `ThemeProvider` (Server Component) lê o tema do banco
3. O CSS é gerado em memória e injetado como `<style>` no `<head>` na hora da requisição
4. **Efeito mundial imediato**: mudar o tema padrão no painel atualiza o visual para todos os usuários no próximo request, sem redeploy

```
Admin salva tema → Banco atualizado → Próximo request de qualquer usuário → CSS novo no <head>
```

### O que é Personalizável
- **5 cores principais**: botões, cards, texto, bordas, botão Discord
- **Fundo da página**: cor sólida ou GIF/imagem via URL (https apenas)
- **Blur do fundo**: 0–20px de desfoque sobre o GIF
- **Grid de linhas**: visível ou oculto
- **Gradiente radial**: 2 pontos com cor, posição X/Y e opacidade independentes
- **3 slots de tema**: o admin pode alternar entre 3 visuais diferentes sem apagar nenhum

---

## 🧙 Método 1 — Setup Wizard (recomendado)

> Ideal para quem quer configurar tudo pelo navegador, com guias explicativos em cada etapa.

```bash
# 1. Clone o repositório
git clone https://github.com/WilsonTeofilo/Vagas-JOB-discord.git
cd Vagas-JOB-discord

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:3000` — o wizard inicia automaticamente e guia você por 5 etapas:

| Etapa | O que configura |
|-------|----------------|
| 1️⃣ Banco de Dados | URL de conexão PostgreSQL (Neon DB recomendado) |
| 2️⃣ Webhooks Discord | URLs dos canais de vagas e freelancers |
| 3️⃣ App Discord | Client ID e Client Secret para OAuth2 |
| 4️⃣ Autenticação | NEXTAUTH_SECRET (pode gerar automaticamente) e URL do site |
| 5️⃣ Comunidade | Link permanente de convite do seu servidor |

Ao concluir, o `.env.local` é gerado automaticamente e o servidor reinicia sozinho.

```bash
# 6. Após o servidor reiniciar, crie as tabelas (apenas na primeira vez)
npx prisma db push

# 7. Inicie novamente
npm run dev
```

> **🔁 Seguro para redeploy**: O wizard só aparece quando as variáveis de ambiente **não estão presentes**. Com `.env.local` preenchido ou variáveis configuradas na Vercel, o sistema ignora completamente o wizard — nenhum novo deploy vai triggar o setup de novo.

---

## 🛠️ Método 2 — Configuração Manual (vanilla)

> Para quem prefere editar arquivos diretamente. Rápido e sem interface.

```bash
git clone https://github.com/WilsonTeofilo/Vagas-JOB-discord.git
cd Vagas-JOB-discord
npm install
```

Crie o arquivo `.env.local` na raiz do projeto:

```env
# ── Banco de Dados (Neon DB recomendado — neon.tech) ─────────────────
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require"

# ── Webhooks do Discord ────────────────────────────────────────────────
# Cada variável deve apontar para o webhook do canal correto no seu servidor
DISCORD_WEBHOOK_URL_VAGAS="https://discord.com/api/webhooks/ID/TOKEN"
DISCORD_WEBHOOK_URL_FREELANCERS="https://discord.com/api/webhooks/ID/TOKEN"

# ── Autenticação ───────────────────────────────────────────────────────
# Em produção substitua por: https://seu-dominio.vercel.app
NEXTAUTH_URL="http://localhost:3000"
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET="sua_chave_secreta_minimo_32_caracteres"

# ── App do Discord (discord.com/developers/applications) ───────────────
DISCORD_CLIENT_ID="id_numerico_do_seu_app"
DISCORD_CLIENT_SECRET="secret_do_seu_app"

# ── Link de Convite da Comunidade (opcional — usado pelo Setup Wizard) ─────
# Configure em src/lib/brand.js → discordInvite para personalizar o link
# exibido no modal de sucesso do formulário e na tela de login.
# NEXT_PUBLIC_DISCORD_SERVER_URL="https://discord.gg/SEU_LINK_PERMANENTE"
```

### Como criar o App no Discord Developer Portal

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. No menu lateral: **OAuth2 → General**
3. Copie o **Client ID** e clique em **Reset Secret** para obter o Client Secret
4. Em **Redirects**, adicione a URL exata:
   - **Local:** `http://localhost:3000/api/auth/callback/discord`
   - **Produção:** `https://seu-dominio.vercel.app/api/auth/callback/discord`

```bash
# Crie as tabelas no banco (apenas na primeira vez)
npx prisma db push

# Inicie o servidor
npm run dev
```

---

## 🚀 Deploy na Vercel

### Passo a Passo

1. **Fork** este repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe seu fork
3. Na seção **Environment Variables**, adicione todas as variáveis do `.env.local` (sem as aspas)
4. Em `NEXTAUTH_URL`, coloque a URL final da sua aplicação: `https://trampo-seu-projeto.vercel.app`
5. No Discord Developer Portal, adicione essa URL de redirect: `https://trampo-seu-projeto.vercel.app/api/auth/callback/discord`
6. Clique em **Deploy**

### Após o Primeiro Deploy

```bash
# Execute remotamente pelo CLI da Vercel (ou via Vercel dashboard → Functions)
# Para criar as tabelas no banco de produção:
npx prisma db push
```

> **📌 Importante**: O `NEXTAUTH_URL` **deve ser a URL exata** onde o site está hospedado. Se usar domínio personalizado, use o domínio final.

### Redeploy Seguro

Ao fazer um novo deploy (após atualizar o código), **nada quebra**:
- O banco de dados continua intacto
- Os temas visuais vivem no banco — não são sobrescritos
- O `.env` da Vercel é preservado entre deploys
- O Setup Wizard fica bloqueado automaticamente (variáveis já presentes)

---

## 📁 Estrutura do Projeto

```
trampo/
├── prisma/
│   └── schema.prisma          # Modelos: User, Admin, JobPost, Theme, UserThemePreference
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # OAuth2 Discord + upsert de usuário no banco
│   │   │   ├── discord/             # POST: publica vaga/freela com rate limit
│   │   │   ├── admin/
│   │   │   │   ├── action/          # POST: aprovar/rejeitar vaga (admin)
│   │   │   │   ├── promote/         # POST: promover usuário a admin (root)
│   │   │   │   ├── demote/          # POST: remover admin (root)
│   │   │   │   ├── me/              # GET: retorna dados do admin autenticado
│   │   │   │   ├── users/           # GET: busca de usuários com rate limit
│   │   │   │   ├── form-config/     # GET/PUT/DELETE: opções dinâmicas do formulário
│   │   │   │   └── ads/             # GET/POST/DELETE: gerenciamento de anúncios
│   │   │   │       └── [id]/        # DELETE: remove anúncio específico
│   │   │   ├── theme/
│   │   │   │   ├── [slot]/          # GET/PUT/DELETE: tema por slot (1,2,3)
│   │   │   │   ├── [slot]/activate/ # PUT: define tema como padrão do site
│   │   │   │   └── preference/      # GET/PUT/DELETE: preferência individual
│   │   │   ├── ads/                 # GET: anúncio ativo (público, anti-adblock)
│   │   │   │   └── click/           # POST: registra clique em anúncio
│   │   │   └── setup/
│   │   │       ├── save/            # POST: grava .env.local (bloqueado em prod)
│   │   │       ├── validate/        # POST: testa DB/webhooks (bloqueado em prod)
│   │   │       └── generate-secret/ # GET: gera NEXTAUTH_SECRET seguro
│   │   ├── admin/
│   │   │   ├── page.js             # Painel de moderação (Server Component)
│   │   │   ├── form-config/        # Editor de opções do formulário (tags + reset)
│   │   │   └── theme-editor/       # Editor visual de temas (Client Component)
│   │   ├── setup/
│   │   │   └── page.js             # Wizard de configuração (5 etapas)
│   │   ├── layout.js               # Layout raiz com ThemeProvider
│   │   └── globals.css             # Design system com CSS Custom Properties
│   │
│   ├── components/
│   │   ├── JobForm.js              # Formulário principal de vagas/freelas
│   │   ├── GlobalHeader.js         # Cabeçalho global fixo com navegação
│   │   ├── AdBanner.js             # Banner de anúncio (float e horizontal)
│   │   ├── DonationModal.js        # Modal de apoio financeiro ao projeto
│   │   ├── ThemeProvider.js        # Server Component: injeta CSS do tema no <head>
│   │   ├── ThemePreviewListener.js # Client Component: recebe preview via postMessage
│   │   ├── ThemeSelector.js        # Seletor de tema individual para usuários
│   │   ├── AdminManager.js         # UI de promoção/remoção de admins
│   │   ├── Providers.js            # SessionProvider do NextAuth
│   │   └── Footer.js               # Rodapé com créditos
│   │
│   ├── services/
│   │   ├── job.service.js          # Regras de negócio: vagas, rate limit, admins
│   │   ├── theme.service.js        # Regras de negócio: temas e preferências
│   │   ├── form-config.service.js  # Opções do formulário (padrão + customizadas)
│   │   └── discord.service.js      # Envio de webhooks + sanitização anti-ping
│   │
│   ├── lib/
│   │   ├── prisma.js               # Singleton do Prisma Client
│   │   ├── brand.js                # Configurações da comunidade (nome, link Discord, doações)
│   │   ├── theme-css.js            # Gerador de CSS puro (re-sanitiza tudo)
│   │   ├── is-admin.js             # Verifica permissão de admin via banco
│   │   └── csrf.js                 # Validação de Origin/Referer anti-CSRF
│   │
│   ├── validations/
│   │   └── schemas.js              # Schemas Zod: vagas, freelas, moderação, admin
│   │
│   ├── data/
│   │   └── education.js            # Listas padrão de faculdades, cursos e níveis
│   │
│   └── proxy.js                    # Middleware: Setup Wizard ↔ App lockdown
```

---

## ⚖️ Licença e Créditos

Este projeto é **open-source** e pode ser clonado, modificado e redistribuído livremente.

**Os créditos ao criador original são obrigatórios:**

- O nome **Trampo** e os créditos **"Desenvolvido por Wilson Teofilo"** presentes no rodapé e no código-fonte **não devem ser removidos** em versões derivadas.
- Ao usar ou distribuir este projeto (ou um fork), mantenha a atribuição visível para os usuários finais.

---

> Criado e mantido por [Wilson Teofilo](https://www.linkedin.com/in/wilson-teofilo/) · [Comunidade Discord](https://discord.gg/XwCzSwT53u)
