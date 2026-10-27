import { getDb }    from '../_shared/db.js';
import { criarPix } from '../_shared/mp.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Body inválido' }, 400); }

  const { email, nome, produto, metodo } = body;

  if (!email || !produto || !metodo)
    return json({ error: 'Campos obrigatórios: email, produto, metodo' }, 400);

  if (!['financas', 'cripto'].includes(produto))
    return json({ error: 'Produto inválido' }, 400);

  const db = getDb(env);

  try {
    await db.from('users').upsert({ email, name: nome }, { onConflict: 'email' });
  } catch (e) { /* Ignora erro de upsert — continua */ }

  let purchase;
  try {
    const { data, error } = await db
      .from('purchases')
      .insert({ user_email: email, product_id: produto, status: 'pending' })
      .select().single();
    if (error) throw error;
    purchase = data;
  } catch (e) {
    return json({ error: 'Erro ao registrar compra no banco' }, 500);
  }

  if (metodo === 'pix') {
    try {
      const pix = await criarPix(env, { email, nome, produto });

      await db.from('purchases')
        .update({ payment_id: String(pix.payment_id) })
        .eq('id', purchase.id);

      return json({
        tipo:       'pix',
        qr_code:    pix.qr_code,
        qr_base64:  pix.qr_base64,
        payment_id: pix.payment_id,
        api_usada:  pix.api
      });
    } catch (e) {
      return json({ error: e.message || 'Erro ao criar PIX no Mercado Pago' }, 500);
    }
  }

  return json({ tipo: 'cartao', purchase_id: purchase.id });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
