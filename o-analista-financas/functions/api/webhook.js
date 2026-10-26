import { getDb }              from '../_shared/db.js';
import { sendAccessEmail }    from '../_shared/email.js';
import { verificarPagamento } from '../_shared/mp.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── Verificação de assinatura do Mercado Pago ──────────────────────────
  const sig       = request.headers.get('x-signature') || '';
  const requestId = request.headers.get('x-request-id') || '';
  const url       = new URL(request.url);
  const dataId    = url.searchParams.get('data.id') || '';
  const ts        = sig.split(',').find(p => p.startsWith('ts='))?.split('=')[1] || '';
  const v1        = sig.split(',').find(p => p.startsWith('v1='))?.split('=')[1] || '';
  const manifest  = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const encoder  = new TextEncoder();
  const key      = await crypto.subtle.importKey(
    'raw', encoder.encode(env.MERCADOPAGO_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuf   = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2,'0')).join('');

  if (computed !== v1) return new Response('Assinatura inválida', { status: 401 });
  // ────────────────────────────────────────────────────────────────────────

  const body = await request.json().catch(() => ({}));
  if (body.type !== 'payment') return new Response('OK', { status: 200 });

  const payment = await verificarPagamento(env, body.data?.id);
  if (payment.status !== 'approved') return new Response('OK', { status: 200 });

  const { produto, email } = payment.metadata;
  const cpf = payment.payer?.identification?.number || null;
  const cpfFormatado = cpf
    ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '000.000.000-00';

  const db = getDb(env);

  await db.from('users').upsert({ email, cpf }, { onConflict: 'email' });
  await db.from('purchases')
    .update({ status: 'approved' })
    .eq('payment_id', String(body.data.id));

  const { data: existing } = await db.from('purchases')
    .select('id').eq('user_email', email).eq('product_id', produto)
    .eq('status', 'approved').maybeSingle();

  if (!existing) {
    await db.from('purchases').insert({
      user_email: email, product_id: produto,
      payment_id: String(body.data.id), status: 'approved'
    });
  }

  // Token único para o magic link
  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const token   = Array.from(tokenArray).map(b => b.toString(16).padStart(2,'0')).join('');
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await db.from('magic_links').insert({ token, email, produto, cpf_formatado: cpfFormatado, expires_at: expires });
  await sendAccessEmail(env, email, token, produto);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
