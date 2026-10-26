// Mercado Pago via REST API pura — sem SDK, funciona em qualquer ambiente

const precos = { financas: 29.90, cripto: 29.90 };

export async function criarPix(env, { email, nome, produto }) {
  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${email}-${produto}-${Date.now()}`
    },
    body: JSON.stringify({
      transaction_amount: precos[produto],
      description:        `Ebook - ${produto}`,
      payment_method_id:  'pix',
      payer: {
        email,
        first_name: nome?.split(' ')[0] || 'Cliente',
        last_name:  nome?.split(' ').slice(1).join(' ') || '-'
      },
      notification_url: `${env.SITE_URL}/api/webhook`,
      metadata: { produto, email }
    })
  });

  const payment = await res.json();
  return {
    payment_id: payment.id,
    qr_code:    payment.point_of_interaction?.transaction_data?.qr_code,
    qr_base64:  payment.point_of_interaction?.transaction_data?.qr_code_base64,
    status:     payment.status
  };
}

export async function verificarPagamento(env, paymentId) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` }
  });
  return res.json();
}
