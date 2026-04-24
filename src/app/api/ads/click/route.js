/**
 * POST /api/ads/click — Registra clique em um anúncio (analytics).
 * Rate limit: 5 req/min por IP para evitar click fraud.
 */
import { NextResponse } from 'next/server';
import { registerClick } from '../../../../services/ads.service';

const ratemap = new Map(); // ip → { count, resetAt }

function checkRate(ip) {
  const now = Date.now();
  const entry = ratemap.get(ip);
  if (!entry || now > entry.resetAt) {
    ratemap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Rate limit.' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  const { adId } = body;
  // Valida formato CUID antes de consultar o banco — rejeita IDs malformados
  const CUID_RE = /^c[a-z0-9]{24,}$/i;
  if (!adId || typeof adId !== 'string' || adId === 'fallback') {
    return NextResponse.json({ ok: true }); // silencioso para fallback
  }
  if (!CUID_RE.test(adId)) {
    return NextResponse.json({ ok: true }); // silencioso — não quebra a UI
  }

  try {
    await registerClick(adId, ip);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // nunca quebrar a UI por falha de analytics
  }
}
