import { getDb }    from '../_shared/db.js';
import { criarPix } from '../_shared/mp.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const { email, nome, produto, metodo } = body;

  if (!email || !produto || !metodo) {
    return json({ error: 'Campos obrigatórios: email, produto, metodo' }, 400);
  }
  if (!['financas', 'cripto'].includes(produto)) {
    return json({ error: 'Produto inválido' }, 400);
  }

  const db = getDb(env);

  await db.from('users').upsert({ email, name: nome }, { onConflict: 'email' });

  const { data: purchase, error } = await db
    .from('purchases')
    .insert({ user_email: email, product_id: produto, status: 'pending' })
    .select().single();

  if (error) return json({ error: 'Erro ao registrar compra' }, 500);

  if (metodo === 'pix') {
    const pix = await criarPix(env, { email, nome, produto });
    await db.from('purchases')
      .update({ payment_id: String(pix.payment_id) })
      .eq('id', purchase.id);
    return json({ tipo: 'pix', qr_code: pix.qr_code, qr_base64: pix.qr_base64, payment_id: pix.payment_id });
  }

  return json({ tipo: 'cartao', purchase_id: purchase.id });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
