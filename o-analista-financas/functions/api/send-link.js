import { getDb }           from '../_shared/db.js';
import { sendAccessEmail } from '../_shared/email.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json().catch(() => ({}));

  if (!email) {
    return new Response(JSON.stringify({ error: 'E-mail obrigatório' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = getDb(env);
  const { data: purchases } = await db.from('purchases')
    .select('product_id').eq('user_email', email).eq('status', 'approved');

  // Sempre retorna 200 — evita confirmar se um e-mail está cadastrado
  if (!purchases?.length) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  for (const p of purchases) {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const token   = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await db.from('magic_links').insert({
      token, email, produto: p.product_id, expires_at: expires
    });
    await sendAccessEmail(env, email, token, p.product_id);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
