/**
 * discord.service.js
 * Responsabilidade única: falar com o Discord.
 * Não sabe nada sobre banco de dados, sessão ou regras de negócio.
 */

// ─── Anti-Ping Sanitizer ──────────────────────────────────────────────────────
// Bloqueia @everyone, @here e menções a cargos/usuários injetados em textos livres.
// Substitui o @ por um caractere invisível para quebrar o ping sem sumir o texto.
function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/@everyone/gi, '@\u200beveryone')  // zero-width space
    .replace(/@here/gi,     '@\u200bhere')
    .replace(/<@[!&]?\d+>/g, '[menção removida]') // remove <@userId> e <@&roleId>
    .replace(/<#\d+>/g,     '[canal removido]');  // remove links de canal
}

// ─── Formatadores de Mensagem ─────────────────────────────────────────────────
function formatVaga({ body, discordId }) {
  const { title, company, level, regime, description, contact } = body;
  return {
    threadName: `${sanitize(title)} — ${sanitize(company)}`.substring(0, 100),
    content: [
      `**Nova Oportunidade!** 💼`,
      `Publicado por: <@${discordId}>`,
      ``,
      `**🏢 Empresa:** ${sanitize(company)}`,
      `**📊 Nível:** ${sanitize(level)}  |  **📋 Regime:** ${sanitize(regime)}`,
      ``,
      `**📝 Descrição:**`,
      sanitize(description),
      ``,
      `**📩 Contato:** ${sanitize(contact)}`,
    ].join('\n'),
  };
}

function formatFreela({ body, discordId }) {
  const { title, company, skills, portfolio, availability, contact, educations } = body;

  const eduLines = (educations || [])
    .filter(e => e.institution || e.course)
    .map(e => `  • ${[e.institution, e.course, e.level, e.status].filter(Boolean).join(' | ')}`)
    .join('\n');

  return {
    threadName: `${sanitize(title)} — ${sanitize(company)}`.substring(0, 100),
    content: [
      `**Freelancer Disponível!** 🚀`,
      `Perfil de: <@${discordId}>`,
      ``,
      `**👤 Profissional:** ${sanitize(company)}`,
      `**💼 Especialidade:** ${sanitize(title)}`,
      ``,
      `**🛠️ Skills:**`,
      sanitize(skills),
      ``,
      `**🔗 Portfólio:** ${sanitize(portfolio)}`,
      `**🕐 Disponibilidade:** ${sanitize(availability)}`,
      ...(eduLines ? [``, `**🎓 Formação:**`, eduLines] : []),
      ``,
      `**📩 Contato:** ${sanitize(contact)}`,
    ].join('\n'),
  };
}

// ─── Sender ───────────────────────────────────────────────────────────────────
export async function sendToDiscord({ body, discordId }) {
  const webhookUrl = body.type === 'vagas'
    ? process.env.DISCORD_WEBHOOK_URL_VAGAS
    : process.env.DISCORD_WEBHOOK_URL_FREELANCERS;

  if (!webhookUrl) {
    throw new Error('Webhook URL não configurado no servidor.');
  }

  const { threadName, content } = body.type === 'vagas'
    ? formatVaga({ body, discordId })
    : formatFreela({ body, discordId });

  const urlWithWait = new URL(webhookUrl);
  urlWithWait.searchParams.set('wait', 'true');

  const response = await fetch(urlWithWait.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username:    'Trampo bot',
      thread_name: threadName,
      content:     content.trim(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord rejeitou o envio: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data.id; // Retorna o messageId do Discord
}

// ─── Delete (Overwrite para canais de Fórum) ─────────────────────────────────
export async function deleteFromDiscord(messageId, type) {
  if (!messageId) return;
  const webhookUrl = type === 'vagas'
    ? process.env.DISCORD_WEBHOOK_URL_VAGAS
    : process.env.DISCORD_WEBHOOK_URL_FREELANCERS;
    
  if (!webhookUrl) return;

  try {
    // Como Webhooks não podem deletar tópicos de fórum inteiros, a solução
    // é SOBRESCREVER o conteúdo da mensagem original (PATCH) com um aviso.
    // IMPORTANTE: Para o Discord, se a mensagem está num tópico, é OBRIGATÓRIO passar o ?thread_id.
    const response = await fetch(`${webhookUrl}/messages/${messageId}?thread_id=${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: "❌ **[ VAGA ENCERRADA / REMOVIDA ]** ❌\n\nEsta oportunidade foi deletada do sistema e não está mais disponível.\n*(Aviso para Admins: Este tópico já pode ser deletado manualmente).*"
      })
    });
    if (!response.ok) {
      console.warn(`Aviso: falha ao sobrescrever mensagem ${messageId} no Discord (${response.status})`);
    }
  } catch (error) {
    console.error('Erro de rede ao sobrescrever no Discord:', error);
  }
}
