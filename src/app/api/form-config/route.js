/**
 * GET /api/form-config
 * Endpoint público — retorna as opções do formulário.
 * Usado pelo JobForm.js para buscar opções dinâmicas.
 */
import { NextResponse } from 'next/server';
import { getAllFormConfig } from '../../../services/form-config.service';

export async function GET() {
  try {
    const config = await getAllFormConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error('[GET /api/form-config]', err);
    return NextResponse.json({ error: 'Erro ao buscar configuração.' }, { status: 500 });
  }
}
