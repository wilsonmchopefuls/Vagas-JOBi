/**
 * GET /api/ads — Retorna 1 anúncio aleatório (público).
 * Quando não há anúncios cadastrados, retorna o CTA fallback do próprio Trampo.
 */
import { NextResponse } from 'next/server';
import { getRandomAd } from '../../../services/ads.service';
import { BRAND } from '../../../lib/brand';

const FALLBACK_AD = {
  id:        'fallback',
  imageUrl:  null,
  targetUrl: BRAND.repoUrl,
  altText:   '⭐ Gostou do Trampo? Deixa uma estrela no GitHub!',
  isFallback: true,
};

export async function GET() {
  try {
    const ad = await getRandomAd();
    return NextResponse.json(ad ?? FALLBACK_AD);
  } catch {
    return NextResponse.json(FALLBACK_AD);
  }
}
