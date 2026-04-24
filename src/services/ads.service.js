/**
 * ads.service.js — Lógica de negócio do sistema de anúncios centralizado.
 * Todas as operações de banco passam por aqui. As rotas API são finas.
 */
import prisma from '../lib/prisma.js';
import { createHash } from 'crypto';

/** Retorna 1 anúncio aleatório ponderado pelo campo `weight`. */
export async function getRandomAd() {
  const ads = await prisma.ad.findMany({ where: { active: true } });
  if (ads.length === 0) return null;

  const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0);
  let random = Math.random() * totalWeight;

  for (const ad of ads) {
    random -= ad.weight;
    if (random <= 0) {
      return { id: ad.id, imageUrl: ad.imageUrl, targetUrl: ad.targetUrl, altText: ad.altText };
    }
  }
  // fallback (arredondamento)
  const last = ads[ads.length - 1];
  return { id: last.id, imageUrl: last.imageUrl, targetUrl: last.targetUrl, altText: last.altText };
}

/** Registra um clique, hashando o IP antes de salvar (LGPD). */
export async function registerClick(adId, rawIp) {
  const ipHash = rawIp
    ? createHash('sha256').update(rawIp + process.env.NEXTAUTH_SECRET).digest('hex').slice(0, 16)
    : null;

  await prisma.adClick.create({ data: { adId, ip: ipHash } });
}

/** Lista todos os anúncios (admin). */
export async function listAds() {
  return prisma.ad.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { clicks: true } } },
  });
}

/** Cria um anúncio. */
export async function createAd({ imageUrl, targetUrl, altText, weight }) {
  return prisma.ad.create({
    data: { imageUrl, targetUrl, altText: altText || 'Anúncio', weight: weight || 1 },
  });
}

/** Atualiza um anúncio. */
export async function updateAd(id, data) {
  return prisma.ad.update({ where: { id }, data });
}

/** Remove um anúncio. */
export async function deleteAd(id) {
  return prisma.ad.delete({ where: { id } });
}
