// Mercado Pago via API de Orders v2
// (Checkout Transparente → API de Orders, conforme configurado no painel MP)

const precos = { financas: 29.90, cripto: 29.90 };

export async function criarPix(env, { email, nome, produto }) {
  const res = await fetch('https://api.mercadopago.com/v2/orders', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${email}-${produto}-${Date.now()}`
    },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'automatic',
      total_amount: String(precos[produto].toFixed(2)),
      external_reference: `${email}-${produto}-${Date.now()}`,
      payer: { email },
      transactions: {
        payments: [{
          amount: String(precos[produto].toFixed(2)),
          payment_method: {
            id:   'pix',
            type: 'bank_transfer'
          }
        }]
      },
      notification_url: `${env.SITE_URL}/api/webhook`,
      metadata: { produto, email }
    })
  });

  const order = await res.json();

  if (!res.ok) {
    throw new Error(order.message || `MP error ${res.status}`);
  }

  // Na API de Orders, o QR fica dentro dos transactions
  const payment    = order.transactions?.payments?.[0];
  const pixData    = payment?.payment_method;
  const qr_code    = pixData?.qr_code    || pixData?.transaction_data?.qr_code    || null;
  const qr_base64  = pixData?.qr_code_base64 || pixData?.transaction_data?.qr_code_base64 || null;

  return {
    payment_id: order.id,
    qr_code,
    qr_base64,
    status: order.status
  };
}

export async function verificarPagamento(env, paymentId) {
  // Webhook da Orders API envia o order_id
  const res = await fetch(`https://api.mercadopago.com/v2/orders/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` }
  });
  const order = await res.json();

  // Extrai e-mail e produto dos metadados
  const email   = order.metadata?.email   || order.payer?.email || '';
  const produto = order.metadata?.produto || '';
  const cpf     = order.payer?.identification?.number || null;

  return {
    status:   order.status === 'processed' ? 'approved' : order.status,
    metadata: { email, produto },
    payer:    { identification: { number: cpf } }
  };
}
