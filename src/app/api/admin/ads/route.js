/**
 * GET  /api/admin/ads — lista anúncios (admin)
 * POST /api/admin/ads — cria anúncio (root admin)
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdmin, isRootAdmin } from '../../../../services/job.service';
import { listAds, createAd } from '../../../../services/ads.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !await isAdmin(session.user.id)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const ads = await listAds();
    return NextResponse.json(ads);
  } catch (err) {
    console.error('[GET /api/admin/ads]', err);
    return NextResponse.json({ error: 'Erro ao listar anúncios.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !await isRootAdmin(session.user.id)) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode criar anúncios.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  const { imageUrl, targetUrl, altText, weight } = body;
  if (!imageUrl || !targetUrl) {
    return NextResponse.json({ error: 'imageUrl e targetUrl são obrigatórios.' }, { status: 400 });
  }
  // Bloqueia URLs de aposta/adult — proteção básica
  const blocked = ['bet', 'casino', 'porn', 'sex', 'adult', 'xxx'];
  if (blocked.some(w => targetUrl.toLowerCase().includes(w) || imageUrl.toLowerCase().includes(w))) {
    return NextResponse.json({ error: 'URL bloqueada pela política de anúncios.' }, { status: 400 });
  }

  try {
    const ad = await createAd({ imageUrl, targetUrl, altText, weight });
    return NextResponse.json(ad, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
