import { writeFileSync } from 'fs';
import { join } from 'path';
import { verifyCsrf } from '../../../../lib/csrf';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const REQUIRED = [
  'DATABASE_URL',
  'DISCORD_WEBHOOK_URL_VAGAS',
  'DISCORD_WEBHOOK_URL_FREELANCERS',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_DISCORD_SERVER_URL',
];

/**
 * POST /api/setup/save
 * CVE-1 fix: bloqueado quando o sistema já está configurado.
 * O setup só roda localmente (sem DATABASE_URL o app não inicia).
 * Em produção, o proxy.js já bloqueia /api/setup/* com 403.
 */
export async function POST(request) {
  if (!verifyCsrf(request)) {
    return Response.json({ error: 'CSRF token inválido.' }, { status: 403 });
  }

  // Bloqueio primário: se já configurado, rejeita completamente
  if (
    process.env.DATABASE_URL &&
    process.env.NEXTAUTH_SECRET &&
    process.env.DISCORD_CLIENT_ID
  ) {
    return Response.json({ error: 'Sistema já configurado. Edite o .env.local diretamente.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  // Re-validação backend de presença de todos os campos obrigatórios
  for (const key of REQUIRED) {
    const val = body[key];
    if (!val || String(val).trim() === '') {
      return Response.json({ error: `Campo obrigatório ausente: ${key}` }, { status: 400 });
    }
  }

  // Sanitiza cada valor: remove quebras de linha e aspas que corrompem o .env
  const safe = (v) => String(v).trim().replace(/[\r\n"\\]/g, '');

  const ts = new Date().toISOString();
  const lines = [
    `# Gerado automaticamente pelo Trampo Setup Wizard`,
    `# ${ts}`,
    ``,
    `DATABASE_URL="${safe(body.DATABASE_URL)}"`,
    ``,
    `DISCORD_WEBHOOK_URL_VAGAS="${safe(body.DISCORD_WEBHOOK_URL_VAGAS)}"`,
    `DISCORD_WEBHOOK_URL_FREELANCERS="${safe(body.DISCORD_WEBHOOK_URL_FREELANCERS)}"`,
    ``,
    `NEXTAUTH_URL="${safe(body.NEXTAUTH_URL)}"`,
    `NEXTAUTH_SECRET="${safe(body.NEXTAUTH_SECRET)}"`,
    `DISCORD_CLIENT_ID="${safe(body.DISCORD_CLIENT_ID)}"`,
    `DISCORD_CLIENT_SECRET="${safe(body.DISCORD_CLIENT_SECRET)}"`,
    ``,
    `# Link do servidor Discord exibido no modal de sucesso`,
    `NEXT_PUBLIC_DISCORD_SERVER_URL="${safe(body.NEXT_PUBLIC_DISCORD_SERVER_URL)}"`,
  ];

  try {
    writeFileSync(join(process.cwd(), '.env.local'), lines.join('\n'), 'utf-8');
  } catch (err) {
    return Response.json({ error: `Erro ao gravar .env.local: ${err.message}` }, { status: 500 });
  }

  // Configura o banco automaticamente para o usuário não precisar dar "npx prisma db push" manual
  try {
    await execAsync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: body.DATABASE_URL }
    });
  } catch (err) {
    console.error('Falha no db push automático:', err);
    // Mesmo falhando, o .env foi salvo. O usuário apenas terá que fazer manual.
  }

  // Responde o frontend ANTES de encerrar o processo
  setTimeout(() => process.exit(0), 1000);

  return Response.json({ success: true });
}
