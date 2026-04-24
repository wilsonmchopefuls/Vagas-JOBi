# Trampo 💼 - Mural de Oportunidades

Uma plataforma fullstack moderna desenvolvida para conectar empresas e talentos de forma simples e direta. O **Trampo** atua como uma ponte entre a comunidade e o Discord, permitindo a postagem de **Vagas de Emprego** e **Perfis de Freelancers** diretamente em canais específicos do servidor.

## 🚀 Funcionalidades

- **Autenticação Segura via Discord (OAuth2)**: Os usuários logam com suas próprias contas do Discord, sem necessidade de criar senhas.
- **Painel de Moderação Avançado (Admin Root)**:
  - Sistema de Bootstrap de hierarquia (o primeiro a entrar no site vira dono absoluto).
  - Promoção e Rebaixamento de moderadores com busca visual por nome e avatar do Discord.
  - Bypass de limite de postagem para admins.
- **Formulários Dinâmicos em Etapas**: Submissão estruturada para vagas e portfólios de freelancing.
- **Integração Nativa com Webhooks**: Envio automático e formatado para os canais do servidor do Discord após aprovação.
- **Segurança Anti-Spam**: Rate limits dinâmicos e sistema de aprovação manual pela equipe de RH para prevenir abusos.

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend:** Next.js 16 (App Router) + React
- **Estilização:** Vanilla CSS Modules (Design System Moderno)
- **Banco de Dados:** PostgreSQL (Prisma v7)
- **Autenticação:** NextAuth.js (Discord Provider)
- **Deploy:** Vercel

## 📦 Como rodar o projeto localmente

1. Clone este repositório:
```bash
git clone https://github.com/SEU_USUARIO/trampo.git
```
2. Instale as dependências:
```bash
npm install
```
3. Configure seu banco de dados e variáveis no arquivo `.env.local`:
```env
DATABASE_URL="postgres://seu_usuario:senha@localhost:5432/trampo"
DISCORD_WEBHOOK_URL_VAGAS="seu_webhook_aqui"
DISCORD_WEBHOOK_URL_FREELANCERS="seu_webhook_aqui"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta"
DISCORD_CLIENT_ID="id_do_app"
DISCORD_CLIENT_SECRET="secret_do_app"
```
4. Sincronize o banco de dados:
```bash
npx prisma db push
```
5. Inicie o servidor local:
```bash
npm run dev
```

---
Desenvolvido com foco na experiência do usuário para fomentar oportunidades na comunidade. 🚀
