/**
 * POST /api/admin/action
 * Controlador fino: valida → verifica permissão → delega ao service.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { moderationActionSchema } from '../../../../validations/schemas';
import { isAdmin, approveJobPost, rejectJobPost } from '../../../../services/job.service';

export async function POST(request) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url));

  // 2. Autorização
  const hasPermission = await isAdmin(session.user.id);
  if (!hasPermission) return NextResponse.redirect(new URL('/', request.url));

  // 3. Validação da ação (Zod: bloqueia IDs inválidos e ações fora do enum)
  let data;
  try {
    const formData = await request.formData();
    data = moderationActionSchema.parse({
      id:     formData.get('id'),
      action: formData.get('action'),
    });
  } catch {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 4. Executa a ação
  try {
    if (data.action === 'APPROVE') await approveJobPost(data.id);
    if (data.action === 'REJECT')  await rejectJobPost(data.id);
  } catch (err) {
    console.error('[POST /api/admin/action]', err);
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}
