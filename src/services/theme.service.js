/**
 * theme.service.js — Regras de negócio para o sistema de temas.
 * Todas as operações de banco passam por aqui. Rotas API são controladores finos.
 */
import prisma from '../lib/prisma';

const MAX_SLOTS = 3;

// ─── Leitura ────────────────────────────────────────────────────────────────

export async function listThemes() {
  return prisma.theme.findMany({ orderBy: { slot: 'asc' } });
}

export async function getThemeById(id) {
  return prisma.theme.findUnique({ where: { id } });
}

export async function getThemeBySlot(slot) {
  return prisma.theme.findUnique({ where: { slot } });
}

/** Retorna o tema padrão do site (isDefault=true). */
export async function getDefaultTheme() {
  return prisma.theme.findFirst({ where: { isDefault: true } });
}

/** Retorna o tema preferido do usuário, ou null se não tiver preferência. */
export async function getUserTheme(userId) {
  const pref = await prisma.userThemePreference.findUnique({
    where: { userId },
    include: { theme: true },
  });
  return pref?.theme ?? null;
}

// ─── Escrita (admin only — validação de autorização feita na rota) ───────────

export async function upsertTheme(slot, { name, config }) {
  if (slot < 1 || slot > MAX_SLOTS) {
    throw new Error(`Slot inválido. Use 1, 2 ou 3.`);
  }
  if (!name?.trim()) throw new Error('Nome do tema é obrigatório.');
  if (name.trim().length > 50) throw new Error('Nome muito longo (máx. 50 caracteres).');

  const safeConfig = sanitizeConfig(config);

  return prisma.theme.upsert({
    where: { slot },
    create: { slot, name: name.trim(), config: safeConfig, isDefault: false },
    update: { name: name.trim(), config: safeConfig, updatedAt: new Date() },
  });
}

export async function deleteTheme(id) {
  // Ao deletar, limpa preferências de usuários que usavam esse tema
  await prisma.userThemePreference.deleteMany({ where: { themeId: id } });
  return prisma.theme.delete({ where: { id } });
}

export async function setDefaultTheme(id) {
  await prisma.theme.updateMany({ data: { isDefault: false } });
  return prisma.theme.update({ where: { id }, data: { isDefault: true } });
}

// ─── Preferência do Usuário ──────────────────────────────────────────────────

export async function setUserThemePreference(userId, themeId) {
  // Verifica que o tema existe
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme) throw new Error('Tema não encontrado.');

  return prisma.userThemePreference.upsert({
    where: { userId },
    create: { userId, themeId },
    update: { themeId },
  });
}

export async function clearUserThemePreference(userId) {
  return prisma.userThemePreference.deleteMany({ where: { userId } });
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

/** Garante que config só contém campos conhecidos e valores seguros. */
function sanitizeConfig(config = {}) {
  const ALLOWED_VARS = [
    '--primary', '--primary-h', '--bg', '--bg-card', '--bg-input',
    '--text', '--text-muted', '--text-subtle', '--border', '--border-focus',
    '--discord', '--discord-h',
  ];

  const sanitizedVars = {};
  if (config.vars && typeof config.vars === 'object') {
    for (const [key, val] of Object.entries(config.vars)) {
      if (ALLOWED_VARS.includes(key) && isValidCssValue(val)) {
        sanitizedVars[key] = String(val).trim();
      }
    }
  }

  return {
    vars: sanitizedVars,
    bgType: config.bgType === 'gif' ? 'gif' : 'color',
    bgGifUrl: config.bgType === 'gif' ? sanitizeUrl(config.bgGifUrl) : null,
    bgBlur: Math.min(20, Math.max(0, Number(config.bgBlur) || 0)),
    showGrid: config.showGrid !== false,
    glowOpacity: Math.min(1, Math.max(0, Number(config.glowOpacity) ?? 1)),
    glowColor1: isValidCssValue(config.glowColor1) ? config.glowColor1 : '#dc2626',
    glowColor2: isValidCssValue(config.glowColor2) ? config.glowColor2 : '#b91c1c',
    glowPosX1: isValidPercent(config.glowPosX1) ? config.glowPosX1 : '15%',
    glowPosY1: isValidPercent(config.glowPosY1) ? config.glowPosY1 : '10%',
    glowPosX2: isValidPercent(config.glowPosX2) ? config.glowPosX2 : '85%',
    glowPosY2: isValidPercent(config.glowPosY2) ? config.glowPosY2 : '90%',
  };
}

/** Aceita: hex, rgb(), rgba(), hsl(), hsla() — rejeita qualquer outra coisa. */
function isValidCssValue(val) {
  if (typeof val !== 'string') return false;
  const v = val.trim();
  return /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/.test(v);
}

/** Aceita apenas URLs https:// (evita javascript: e data: URIs). */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

function isValidPercent(val) {
  return typeof val === 'string' && /^\d{1,3}%$/.test(val.trim());
}

/** Gera a string CSS — re-exportado de lib/theme-css para compatibilidade. */
export { buildThemeCss } from '../lib/theme-css';
