// GET /api/check-session
// Verifica se o cookie de sessão é válido e retorna dados do usuário
import { getDb } from '../_shared/db.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie       = request.headers.get('Cookie') || '';
  const sessionToken = cookie.split(';')
    .find(c => c.trim().startsWith('fd_session='))
    ?.split('=')[1]?.trim();

  if (!sessionToken) return json({ valid: false });

  const db = getDb(env);

  const { data: session } = await db
    .from('sessions').select('email, expires_at')
    .eq('token', sessionToken).maybeSingle();

  if (!session || new Date(session.expires_at) < new Date())
    return json({ valid: false });

  const { data: user } = await db
    .from('users').select('cpf').eq('email', session.email).maybeSingle();

  const cpf = user?.cpf;
  const cpfFormatado = cpf
    ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : null;

  return json({ valid: true, email: session.email, cpf_formatado: cpfFormatado });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
