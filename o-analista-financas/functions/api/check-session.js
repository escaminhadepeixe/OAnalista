// GET /api/check-session — diz se há sessão válida e quais ebooks o usuário comprou
import { getDb }           from '../_shared/db.js';
import { getSessionEmail } from '../_shared/session.js';

export async function onRequestGet({ request, env }) {
  const db    = getDb(env);
  const email = await getSessionEmail(db, request);
  if (!email) return json({ valid: false });

  const { data: compras } = await db.from('purchases')
    .select('product_id').eq('user_email', email).eq('status', 'approved');

  const produtos = [...new Set((compras || []).map(c => c.product_id))];
  return json({ valid: true, email, produtos });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
