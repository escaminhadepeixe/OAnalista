// Mercado Pago — tenta Orders API v2, com fallback para Payments API v1
const precos = { financas: 29.90, cripto: 29.90 };

export async function criarPix(env, { email, nome, produto }) {
  const valor = precos[produto];

  // ── Tenta Orders API v2 ────────────────────────────────────────────────
  const resOrders = await fetch('https://api.mercadopago.com/v2/orders', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'Authorization':     `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${email}-${produto}-${Date.now()}`
    },
    body: JSON.stringify({
      type:             'online',
      processing_mode:  'automatic',
      total_amount:     valor.toFixed(2),
      external_reference: `${email}-${produto}-${Date.now()}`,
      payer:            { email },
      transactions: {
        payments: [{
          amount: valor.toFixed(2),
          payment_method: { id: 'pix', type: 'bank_transfer' }
        }]
      },
      notification_url: `${env.SITE_URL}/api/webhook`,
      metadata:         { produto, email }
    })
  });

  const textOrders = await resOrders.text();
  let order;
  try { order = JSON.parse(textOrders); } catch (e) {
    order = { error: textOrders.substring(0, 300) };
  }

  if (resOrders.ok && order.id) {
    const payment   = order.transactions?.payments?.[0];
    const pixData   = payment?.payment_method || {};
    return {
      payment_id: order.id,
      qr_code:    pixData.qr_code    || pixData.transaction_data?.qr_code    || null,
      qr_base64:  pixData.qr_code_base64 || pixData.transaction_data?.qr_code_base64 || null,
      status:     order.status,
      api:        'orders_v2'
    };
  }

  // ── Fallback: Payments API v1 ──────────────────────────────────────────
  const resPayments = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'Authorization':     `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${email}-${produto}-${Date.now()}-v1`
    },
    body: JSON.stringify({
      transaction_amount: valor,
      description:        `Ebook - ${produto}`,
      payment_method_id:  'pix',
      payer:              { email, first_name: nome?.split(' ')[0] || 'Cliente' },
      notification_url:   `${env.SITE_URL}/api/webhook`,
      metadata:           { produto, email }
    })
  });

  const textPayments = await resPayments.text();
  let payment;
  try { payment = JSON.parse(textPayments); } catch (e) {
    throw new Error(`MP retornou resposta inválida: ${textPayments.substring(0, 200)}`);
  }

  if (!resPayments.ok) {
    throw new Error(`MP erro ${resPayments.status}: ${payment?.message || payment?.cause?.[0]?.description || textPayments.substring(0, 200)}`);
  }

  return {
    payment_id: payment.id,
    qr_code:    payment.point_of_interaction?.transaction_data?.qr_code    || null,
    qr_base64:  payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
    status:     payment.status,
    api:        'payments_v1'
  };
}

export async function verificarPagamento(env, paymentId) {
  // Tenta Orders v2 primeiro
  const resOrders = await fetch(`https://api.mercadopago.com/v2/orders/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` }
  });

  if (resOrders.ok) {
    const order = await resOrders.json();
    return {
      status:   order.status === 'processed' ? 'approved' : order.status,
      metadata: order.metadata || {},
      payer:    { identification: { number: order.payer?.identification?.number || null } }
    };
  }

  // Fallback: Payments v1
  const res     = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` }
  });
  const payment = await res.json();
  return {
    status:   payment.status,
    metadata: payment.metadata || {},
    payer:    payment.payer
  };
}
