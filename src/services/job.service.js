/**
 * job.service.js
 * Responsabilidade única: regras de negócio de vagas e freelas.
 * Não sabe nada sobre HTTP, sessão ou Discord.
 */

import prisma from '../lib/prisma.js';
import { sendToDiscord } from './discord.service.js';

// ─── Constantes de Negócio ────────────────────────────────────────────────────
const VAGA_LIMITE_MENSAL_DIRETO = 3;   // acima disso vai pra moderação
const FREELA_LIMITE_DIAS        = 30;  // dias de cooldown para freelas

// ─── Helpers de Data ──────────────────────────────────────────────────────────
function startOfCurrentMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ─── Verificações de Rate Limit ───────────────────────────────────────────────
async function checkFreelaLimit(discordId) {
  const recent = await prisma.jobPost.findFirst({
    where: {
      discordId,
      type:      'freelancers',
      status:    { not: 'REJECTED' },
      createdAt: { gte: daysAgo(FREELA_LIMITE_DIAS) },
    },
  });

  if (recent) {
    const nextAvailable = new Date(recent.createdAt.getTime() + FREELA_LIMITE_DIAS * 24 * 60 * 60 * 1000);
    const diasRestantes = Math.ceil((nextAvailable - Date.now()) / (1000 * 60 * 60 * 24));
    
    // Formata a data: ex: 25/05/2026
    const dataFormatada = nextAvailable.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    throw new RateLimitError(
      `Você já ofereceu seus serviços recentemente. O cooldown zera dia ${dataFormatada} (faltam ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}).`
    );
  }
}

async function checkVagaLimit(discordId) {
  const count = await prisma.jobPost.count({
    where: {
      discordId,
      type:      'vagas',
      status:    { not: 'REJECTED' },
      createdAt: { gte: startOfCurrentMonth() },
    },
  });
  return count >= VAGA_LIMITE_MENSAL_DIRETO; // true = vai pra moderação
}

// ─── Erros Tipados ────────────────────────────────────────────────────────────
export class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ─── Casos de Uso (Use Cases) ─────────────────────────────────────────────────

/**
 * Cria uma nova postagem (vaga ou freela).
 * Aplica rate limiting e decide se vai direto ou para moderação.
 */
export async function createJobPost({ body, discordId }) {
  const isVaga = body.type === 'vagas';
  const userIsAdmin = await isAdmin(discordId);

  let isPending = false;
  
  if (!userIsAdmin) {
    if (!isVaga) {
      await checkFreelaLimit(discordId);
    } else {
      isPending = await checkVagaLimit(discordId);
    }
  }

  const status = isPending ? 'PENDING' : 'APPROVED';

  // Persiste no banco
  await prisma.jobPost.create({
    data: {
      type:      body.type,
      status,
      discordId,
      payload:   JSON.stringify(body),
    },
  });

  // Se aprovado diretamente, envia pro Discord
  if (!isPending) {
    await sendToDiscord({ body, discordId });
  }

  return { isPending };
}

/**
 * Aprova uma vaga pendente: envia ao Discord e atualiza o status.
 */
export async function approveJobPost(id) {
  const job = await prisma.jobPost.findUnique({ where: { id } });
  if (!job || job.status !== 'PENDING') {
    throw new Error('Postagem não encontrada ou já processada.');
  }

  let body;
  try {
    body = JSON.parse(job.payload);
  } catch {
    throw new Error(`Payload corrompido na postagem ${id}. Não foi possível enviar ao Discord.`);
  }

  await sendToDiscord({ body, discordId: job.discordId });
  await prisma.jobPost.update({ where: { id }, data: { status: 'APPROVED' } });

  // Notifica o autor
  await prisma.notification.create({
    data: {
      discordId: job.discordId,
      title: '✅ Publicação Aprovada',
      message: `Sua postagem de ${job.type === 'vagas' ? 'Vaga' : 'Freelancer'} foi aprovada e enviada para o Discord!`,
    }
  });
}

/**
 * Rejeita uma vaga pendente.
 */
export async function rejectJobPost(id, reason) {
  const job = await prisma.jobPost.findUnique({ where: { id } });
  if (job && job.status === 'PENDING') {
    await prisma.jobPost.update({ where: { id }, data: { status: 'REJECTED' } });
    
    // Notifica o autor
    await prisma.notification.create({
      data: {
        discordId: job.discordId,
        title: '❌ Publicação Rejeitada',
        message: `Sua postagem de ${job.type === 'vagas' ? 'Vaga' : 'Freelancer'} não foi aprovada pela moderação.\nMotivo: ${reason}`,
      }
    });
  }
}

/**
 * Verifica se um Discord ID é administrador.
 */
export async function isAdmin(discordId) {
  const admin = await prisma.admin.findUnique({ where: { discordId } });
  return !!admin;
}

/**
 * Verifica se um Discord ID é Root Admin (Dono).
 */
export async function isRootAdmin(discordId) {
  const admin = await prisma.admin.findUnique({ where: { discordId } });
  return admin?.addedBy === 'SYSTEM';
}

/**
 * Bootstrap: se não houver nenhum admin, o primeiro acesso vira dono.
 * Retorna true se o usuário TEM acesso ao painel.
 */
export async function bootstrapAdmin(discordId) {
  const count = await prisma.admin.count();
  if (count === 0) {
    await prisma.admin.create({ data: { discordId, addedBy: 'SYSTEM' } });
    return true;
  }
  return isAdmin(discordId);
}

/**
 * Promove um Discord ID a administrador.
 */
export async function promoteToAdmin({ newDiscordId, promotedBy }) {
  await prisma.admin.upsert({
    where:  { discordId: newDiscordId },
    update: {},
    create: { discordId: newDiscordId, addedBy: promotedBy },
  });

  await prisma.notification.create({
    data: {
      discordId: newDiscordId,
      title: '🛡️ Você foi promovido',
      message: 'Você agora é um administrador do painel. Acesse a área de administração para moderar as publicações.',
    }
  });
}

/**
 * Rebaixa (Remove) um administrador.
 */
export async function demoteAdmin(discordId) {
  await prisma.admin.delete({
    where: { discordId },
  });

  await prisma.notification.create({
    data: {
      discordId,
      title: '🔻 Acesso revogado',
      message: 'Seu acesso de administrador foi removido por um Root.',
    }
  });
}
