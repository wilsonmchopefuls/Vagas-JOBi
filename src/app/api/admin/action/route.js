/**
 * POST /api/admin/action
 * Controlador fino: valida → verifica permissão → delega ao service.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { moderationActionSchema } from '../../../../validations/schemas';
import { isAdmin, approveJobPost, rejectJobPost } from '../../../../services/job.service';
import { verifyCsrf } from '../../../../lib/csrf';

export async function POST(request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  }

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
      reason: formData.get('reason') || undefined,
    });
  } catch {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 4. Executa a ação
  try {
    if (data.action === 'APPROVE') await approveJobPost(data.id);
    if (data.action === 'REJECT')  await rejectJobPost(data.id, data.reason);
  } catch (err) {
    console.error('[POST /api/admin/action]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Se foi via form nativo, tem um redirect. Se foi via fetch client-side, ele apenas lê o json.
  return NextResponse.redirect(new URL('/admin', request.url));
}
