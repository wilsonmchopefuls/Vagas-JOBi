import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { jobSchema } from '../../../validations/schemas';
import { createJobPost, RateLimitError } from '../../../services/job.service';
import { verifyCsrf } from '../../../lib/csrf';

export async function POST(request) {
  // 0. CSRF — bloqueia requisições cross-origin
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 403 });
  }

  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado. Faça login primeiro.' }, { status: 401 });
  }

  // 2. Validação do payload (Zod blinda contra payloads maliciosos e gigantes)
  let body;
  try {
    const raw = await request.json();
    body = jobSchema.parse(raw);
  } catch (err) {
    const message = err.errors?.[0]?.message ?? 'Dados inválidos na requisição.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 3. Regras de negócio (rate limit, banco e Discord)
  try {
    const { isPending } = await createJobPost({ body, discordId: session.user.id });

    const message = isPending
      ? 'Você atingiu o limite de 3 vagas diretas este mês. Sua postagem foi enviada para aprovação dos administradores. ⏳'
      : 'Publicado com sucesso no Discord! 🎉';

    return NextResponse.json({ success: true, message });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error('[POST /api/discord]', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
