/**
 * theme-css.js — Funções PURAS de geração de CSS para temas.
 * Re-sanitiza todos os valores vindos do banco antes de injetar no <style>
 * para garantir que mesmo dados corrompidos no banco não causem CSS Injection.
 * (CVE-4 fix)
 */

// Aceita apenas valores CSS de cor seguros
function isSafeColor(val) {
  if (typeof val !== 'string') return false;
  const v = val.trim();
  return /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)|transparent)$/.test(v);
}

// Aceita apenas percentuais inteiros 0-100
function isSafePercent(val) {
  if (typeof val !== 'string') return false;
  return /^\d{1,3}%$/.test(val.trim()) && parseInt(val) <= 100;
}

// Aceita apenas números 0-1
function isSafeOpacity(val) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

// Aceita apenas URLs https:// — sem quebras de linha, sem aspas internas
function isSafeUrl(val) {
  if (typeof val !== 'string') return false;
  try {
    const u = new URL(val.trim());
    // Bloqueia qualquer caractere suspeito que possa quebrar o contexto CSS
    if (/['"\\\n\r]/.test(u.href)) return false;
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Allowed CSS custom property names
const ALLOWED_VAR_NAMES = new Set([
  '--primary', '--primary-h', '--bg', '--bg-card', '--bg-input',
  '--text', '--text-muted', '--text-subtle', '--border', '--border-focus',
  '--discord', '--discord-h',
]);

// Mapeia cor sólida (Hex) para um RGBA seguro com opacidade para os glows
function hexToGlowRgba(hex, alpha) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(220,38,38,${alpha})`; // fallback seguro (vermelho padrão)
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Gera a string CSS a ser injetada no <head> para um tema. */
export function buildThemeCss(theme) {
  if (!theme?.config) return '';
  const c = theme.config;
  const vars = c.vars || {};

  // Re-sanitiza TODOS os valores — nunca confia cegamente no banco
  const safeVarLines = Object.entries(vars)
    .filter(([k, v]) => ALLOWED_VAR_NAMES.has(k) && isSafeColor(v))
    .map(([k, v]) => `  ${k}: ${v.trim()};`)
    .join('\n');

  const showGrid      = c.showGrid !== false;
  const glowOpacity   = isSafeOpacity(c.glowOpacity) ? Number(c.glowOpacity) : 1;
  const primaryColor  = isSafeColor(vars['--primary']) ? vars['--primary'].trim() : '#dc2626';
  const primaryGlow   = hexToGlowRgba(primaryColor, 0.25);
  
  const glowColor1    = isSafeColor(c.glowColor1)  ? hexToGlowRgba(c.glowColor1.trim(), 0.14) : 'rgba(220,38,38,0.14)';
  const glowColor2    = isSafeColor(c.glowColor2)  ? hexToGlowRgba(c.glowColor2.trim(), 0.10) : 'rgba(220,38,38,0.10)';
  const glowPosX1     = isSafePercent(c.glowPosX1) ? c.glowPosX1.trim()  : '15%';
  const glowPosY1     = isSafePercent(c.glowPosY1) ? c.glowPosY1.trim()  : '10%';
  const glowPosX2     = isSafePercent(c.glowPosX2) ? c.glowPosX2.trim()  : '85%';
  const glowPosY2     = isSafePercent(c.glowPosY2) ? c.glowPosY2.trim()  : '90%';

  let css = `:root {\n${safeVarLines}`;
  css += `\n  --primary-glow: ${primaryGlow};`;
  css += `\n  --grid-color: ${showGrid ? 'rgba(255,255,255,0.025)' : 'transparent'};`;
  css += `\n  --glow-opacity: ${glowOpacity};`;
  css += `\n  --glow-color-1: ${glowColor1};`;
  css += `\n  --glow-color-2: ${glowColor2};`;
  css += `\n  --glow-pos-x-1: ${glowPosX1};`;
  css += `\n  --glow-pos-y-1: ${glowPosY1};`;
  css += `\n  --glow-pos-x-2: ${glowPosX2};`;
  css += `\n  --glow-pos-y-2: ${glowPosY2};`;
  css += `\n}`;

  // GIF background: URL re-validada aqui também
  if (c.bgType === 'gif' && c.bgGifUrl && isSafeUrl(c.bgGifUrl)) {
    const safeUrl = c.bgGifUrl.trim();
    const blurPx = Math.min(20, Math.max(0, Number(c.bgBlur) || 0));
    css += `\nbody{background-image:url("${safeUrl}");background-size:cover;background-position:center;background-attachment:fixed;}`;
    css += `\nbody::before{background-image:none!important;backdrop-filter:blur(${blurPx}px);background:rgba(0,0,0,0.3);}`;
  }

  return css;
}
