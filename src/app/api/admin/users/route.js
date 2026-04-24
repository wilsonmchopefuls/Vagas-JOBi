/**
 * GET /api/admin/users?q=...
 * Retorna usuários do banco que dão match com a query.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isRootAdmin } from '../../../../services/job.service';
import prisma from '../../../../lib/prisma';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Apenas Root precisa pesquisar usuários para promover
  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) return NextResponse.json([], { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const users = await prisma.user.findMany({
      where: {
        name: { contains: q }
      },
      take: 10,
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}
