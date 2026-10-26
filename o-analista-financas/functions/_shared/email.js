// Envia e-mail via Brevo (antigo Sendinblue) — funciona via fetch, sem Node.js
// Gratuito: 300 e-mails/dia. Crie conta em brevo.com

const nomes = {
  financas: 'Finanças Pessoais na Prática',
  cripto:   'Renda Passiva em Criptomoedas'
};

export async function sendAccessEmail(env, email, token, produto) {
  const url  = `${env.SITE_URL}/api/verify-link?token=${token}`;
  const nome = nomes[produto] || produto;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender:      { name: 'O Analista Finanças', email: env.SENDER_EMAIL },
      to:          [{ email }],
      subject:     `Seu acesso: ${nome}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#0D1B2E;margin-bottom:8px">Acesso liberado! 🎉</h2>
          <p style="color:#374151;margin-bottom:24px">
            Seu ebook <strong>${nome}</strong> está pronto para leitura.
            Clique no botão abaixo para acessar:
          </p>
          <a href="${url}"
             style="background:#1B56D6;color:#fff;padding:13px 28px;border-radius:6px;
                    text-decoration:none;font-weight:600;display:inline-block">
            Acessar o ebook →
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
            Link válido por 48 horas. Se você não fez esta compra, ignore este e-mail.
          </p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
}
