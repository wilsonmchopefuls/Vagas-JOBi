/**
 * POST /api/admin/demote
 * Apenas Root Admin pode rebaixar outros moderadores.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isRootAdmin, demoteAdmin } from '../../../../services/job.service';
import { verifyCsrf } from '../../../../lib/csrf';
import { promoteSchema } from '../../../../validations/schemas';

export async function POST(request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url));

  // Apenas ROOT pode despromover
  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) return NextResponse.redirect(new URL('/', request.url));

  let data;
  try {
    const formData = await request.formData();
    // Valida Snowflake — mesma regra do promote
    data = promoteSchema.parse({ discordId: formData.get('discordId') });
  } catch {
    return NextResponse.redirect(new URL('/admin?error=invalid_id', request.url));
  }

  try {
    // Não pode despromover a si mesmo (Root)
    if (data.discordId !== session.user.id) {
      await demoteAdmin(data.discordId);
    }
  } catch (err) {
    console.error('[POST /api/admin/demote]', err);
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}

