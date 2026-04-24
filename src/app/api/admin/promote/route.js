/**
 * POST /api/admin/promote
 * Controlador fino: valida Snowflake ID → verifica permissão → delega ao service.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { promoteSchema } from '../../../../validations/schemas';
import { isRootAdmin, promoteToAdmin } from '../../../../services/job.service';
import { verifyCsrf } from '../../../../lib/csrf';

export async function POST(request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  }

  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) {
    return NextResponse.json({ error: 'Acesso negado. Apenas o Root Admin pode promover.' }, { status: 403 });
  }

  // 3. Validação do Discord ID (Zod: exige Snowflake, bloqueia IDs falsos/injetados)
  let data;
  try {
    const formData = await request.formData();
    data = promoteSchema.parse({ discordId: formData.get('discordId') });
  } catch {
    return NextResponse.json({ error: 'ID do Discord inválido. Deve conter 17–20 dígitos.' }, { status: 400 });
  }

  // 4. Promove o usuário
  try {
    await promoteToAdmin({ newDiscordId: data.discordId, promotedBy: session.user.id });
  } catch (err) {
    console.error('[POST /api/admin/promote]', err);
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}
