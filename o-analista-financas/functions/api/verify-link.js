import { getDb } from '../_shared/db.js';

const readers = {
  financas: '/reader-financas.html',
  cripto:   '/reader-cripto.html'
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = new URL(request.url).searchParams.get('token');

  if (!token) return Response.redirect(`${env.SITE_URL}/login.html?erro=token_invalido`, 302);

  const db = getDb(env);
  const { data: link } = await db
    .from('magic_links').select('*').eq('token', token).maybeSingle();

  if (!link)                               return Response.redirect(`${env.SITE_URL}/login.html?erro=token_invalido`, 302);
  if (link.used)                           return Response.redirect(`${env.SITE_URL}/login.html?erro=token_usado`, 302);
  if (new Date(link.expires_at) < new Date()) return Response.redirect(`${env.SITE_URL}/login.html?erro=token_expirado`, 302);

  await db.from('magic_links').update({ used: true }).eq('token', token);

  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  const sessionToken = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
  const expires      = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.from('sessions').insert({
    token: sessionToken, email: link.email, expires_at: expires.toISOString()
  });

  const destination = readers[link.produto] || '/login.html';
  const response    = Response.redirect(`${env.SITE_URL}${destination}`, 302);

  const headers = new Headers(response.headers);
  headers.set('Set-Cookie',
    `fd_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`
  );

  return new Response(null, { status: 302, headers });
}
