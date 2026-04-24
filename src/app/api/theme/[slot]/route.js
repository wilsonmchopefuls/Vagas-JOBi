/** GET /api/theme/[slot] — Retorna um tema pelo slot (1,2,3).
 *  PUT /api/theme/[slot] — Cria/atualiza tema (admin only).
 *  DELETE /api/theme/[slot] — Remove tema (admin only). */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isRootAdmin } from '../../../../services/job.service';
import {
  getThemeBySlot,
  upsertTheme,
  deleteTheme,
} from '../../../../services/theme.service';

export async function GET(_, { params }) {
  const slot = Number(params.slot);
  if (!slot) return NextResponse.json({ error: 'Slot inválido.' }, { status: 400 });

  const theme = await getThemeBySlot(slot);
  if (!theme) return NextResponse.json(null);
  return NextResponse.json(theme);
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  const ok = session?.user?.id && await isRootAdmin(session.user.id);
  if (!ok) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode editar temas.' }, { status: 403 });
  }

  const slot = Number(params.slot);
  if (slot < 1 || slot > 3) {
    return NextResponse.json({ error: 'Slot deve ser 1, 2 ou 3.' }, { status: 400 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  try {
    const theme = await upsertTheme(slot, body);
    return NextResponse.json(theme);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_, { params }) {
  const session = await getServerSession(authOptions);
  const ok = session?.user?.id && await isRootAdmin(session.user.id);
  if (!ok) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode deletar temas.' }, { status: 403 });
  }

  const slot = Number(params.slot);
  const theme = await getThemeBySlot(slot);
  if (!theme) return NextResponse.json({ error: 'Tema não encontrado.' }, { status: 404 });

  await deleteTheme(theme.id);
  return NextResponse.json({ success: true });
}
