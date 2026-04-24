/**
 * GET /api/admin/me — retorna permissões do usuário logado.
 * Usado pelo GlobalHeader para decidir quais itens de menu mostrar.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdmin, isRootAdmin } from '../../../../services/job.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ isAdmin: false, isRoot: false });
  }
  const [admin, root] = await Promise.all([
    isAdmin(session.user.id),
    isRootAdmin(session.user.id),
  ]);
  return NextResponse.json({ isAdmin: admin, isRoot: root });
}
