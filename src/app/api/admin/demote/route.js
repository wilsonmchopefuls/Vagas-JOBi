/**
 * POST /api/admin/demote
 * Apenas Root Admin pode rebaixar outros moderadores.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isRootAdmin, demoteAdmin } from '../../../../services/job.service';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url));

  // Apenas ROOT pode despromover
  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) return NextResponse.redirect(new URL('/', request.url));

  try {
    const formData = await request.formData();
    const discordId = formData.get('discordId');

    // Não pode despromover a si mesmo (Root)
    if (discordId !== session.user.id) {
      await demoteAdmin(discordId);
    }
  } catch (err) {
    console.error('[POST /api/admin/demote]', err);
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}
