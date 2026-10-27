// Envio de e-mails via Brevo (gratuito, 300/dia, sem domínio próprio necessário)

const nomes = {
  financas: 'Finanças Pessoais na Prática',
  cripto:   'Renda Passiva em Criptomoedas'
};

async function brevoSend(env, payload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': env.BREVO_API_KEY },
    body:    JSON.stringify({
      sender: { name: 'O Analista Finanças', email: env.SENDER_EMAIL },
      ...payload
    })
  });
  if (!res.ok) throw new Error('Brevo error: ' + await res.text());
}

// E-mail de acesso (após pagamento aprovado)
export async function sendAccessEmail(env, email, token, produto) {
  const url  = `${env.SITE_URL}/api/verify-link?token=${token}`;
  const nome = nomes[produto] || produto;
  await brevoSend(env, {
    to:          [{ email }],
    subject:     `Seu acesso: ${nome}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#0D1B2E;margin-bottom:8px">Acesso liberado! 🎉</h2>
        <p style="color:#374151;margin-bottom:24px">
          Seu ebook <strong>${nome}</strong> está pronto para leitura.
        </p>
        <a href="${url}"
           style="background:#1B56D6;color:#fff;padding:13px 28px;border-radius:6px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Acessar o ebook →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
          Link válido por 48 horas. Guarde este e-mail para acessar de outros dispositivos.
        </p>
      </div>`
  });
}

// E-mail de recuperação (checkout abandonado)
export async function sendRecoveryEmail(env, email, produto) {
  const nome   = nomes[produto] || produto;
  const pagina = produto === 'financas' ? 'financas.html' : 'cripto.html';
  const url    = `${env.SITE_URL}/${pagina}`;
  await brevoSend(env, {
    to:          [{ email }],
    subject:     `Você deixou algo para trás 📚`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#0D1B2E;margin-bottom:8px">Ei, você esqueceu algo! 👋</h2>
        <p style="color:#374151;margin-bottom:16px">
          Você chegou perto de garantir o <strong>${nome}</strong> mas não finalizou a compra.
        </p>
        <p style="color:#374151;margin-bottom:24px">
          O ebook continua disponível. Clique abaixo para voltar e concluir:
        </p>
        <a href="${url}"
           style="background:#1B56D6;color:#fff;padding:13px 28px;border-radius:6px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Voltar e finalizar compra →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
          Se não foi você quem iniciou essa compra, pode ignorar este e-mail.
        </p>
      </div>`
  });
}
