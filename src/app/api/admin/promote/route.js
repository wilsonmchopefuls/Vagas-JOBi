/**
 * POST /api/admin/promote
 * Controlador fino: valida Snowflake ID → verifica permissão → delega ao service.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { promoteSchema } from '../../../../validations/schemas';
import { isRootAdmin, promoteToAdmin } from '../../../../services/job.service';

export async function POST(request) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url));

  // 2. Autorização (Apenas ROOT pode promover)
  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) return NextResponse.redirect(new URL('/', request.url));

  // 3. Validação do Discord ID (Zod: exige Snowflake, bloqueia IDs falsos/injetados)
  let data;
  try {
    const formData = await request.formData();
    data = promoteSchema.parse({ discordId: formData.get('discordId') });
  } catch (err) {
    // Redireciona com parâmetro de erro para exibir no painel
    return NextResponse.redirect(new URL('/admin?error=invalid_id', request.url));
  }

  // 4. Promove o usuário
  try {
    await promoteToAdmin({ newDiscordId: data.discordId, promotedBy: session.user.id });
  } catch (err) {
    console.error('[POST /api/admin/promote]', err);
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}
