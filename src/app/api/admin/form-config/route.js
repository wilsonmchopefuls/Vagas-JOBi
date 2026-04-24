/**
 * /api/admin/form-config
 * GET  — retorna config com metadados (admin + root)
 * PUT  — salva opções de uma chave (admin + root)
 * DELETE — reseta uma chave ao padrão (admin + root)
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdmin } from '../../../../services/job.service';
import {
  getAllFormConfigWithMeta,
  setFormConfigKey,
  resetFormConfigKey,
  FORM_CONFIG_KEYS,
} from '../../../../services/form-config.service';

async function requireAdmin(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const ok = await isAdmin(session.user.id);
  return ok ? session : null;
}

export async function GET(request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const config = await getAllFormConfigWithMeta();
    return NextResponse.json(config);
  } catch (err) {
    console.error('[GET /api/admin/form-config]', err);
    return NextResponse.json({ error: 'Erro ao buscar configuração.' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  const { key, options } = body;
  if (!key || !FORM_CONFIG_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
  }
  if (!Array.isArray(options)) {
    return NextResponse.json({ error: 'options deve ser um array.' }, { status: 400 });
  }
  try {
    const saved = await setFormConfigKey(key, options);
    return NextResponse.json({ success: true, saved });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  const { key } = body;
  if (!key || !FORM_CONFIG_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 });
  }
  try {
    await resetFormConfigKey(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
