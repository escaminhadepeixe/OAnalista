// GET  /api/reviews?produto=financas  → lista avaliações aprovadas
// POST /api/reviews                   → envia nova avaliação (entra como pendente)
import { getDb } from '../_shared/db.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const produto = new URL(request.url).searchParams.get('produto');
  if (!produto) return json({ error: 'produto obrigatório' }, 400);

  const db = getDb(env);
  const { data, error } = await db
    .from('reviews')
    .select('author, city, rating, body, created_at')
    .eq('product_id', produto)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return json({ error: error.message }, 500);
  return json(data || []);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body inválido' }, 400); }

  const { product_id, author, city, rating, text } = body;

  if (!product_id || !author || !text)
    return json({ error: 'Campos obrigatórios: product_id, author, text' }, 400);
  if (!['financas','cripto'].includes(product_id))
    return json({ error: 'product_id inválido' }, 400);

  const db = getDb(env);
  const { error } = await db.from('reviews').insert({
    product_id,
    author:   author.trim().substring(0, 80),
    city:     city?.trim().substring(0, 60) || null,
    rating:   Math.min(5, Math.max(1, parseInt(rating) || 5)),
    body:     text.trim().substring(0, 800),
    approved: false,
    source:   'site'
  });

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, message: 'Avaliação recebida! Será publicada após revisão.' });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
