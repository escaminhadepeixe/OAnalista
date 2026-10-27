// POST /api/logout — encerra a sessão no banco e apaga o cookie
import { getDb }           from '../_shared/db.js';
import { getSessionToken } from '../_shared/session.js';

export async function onRequestPost({ request, env }) {
  const token = getSessionToken(request);
  if (token) await getDb(env).from('sessions').delete().eq('token', token);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'fd_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  });
}
