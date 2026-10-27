// POST /api/run-recovery
// Chamado por um cron externo (cron-job.org) a cada 2 horas.
// Protegido por CRON_SECRET para evitar chamadas não autorizadas.
//
// O que faz:
//   1. Envia e-mail de recuperação para checkouts abandonados (pendentes > 2h)
//   2. Apaga compras pendentes com mais de 7 dias
//   3. Apaga usuários sem nenhuma compra aprovada e sem pendente recente

import { getDb }              from '../_shared/db.js';
import { sendRecoveryEmail }  from '../_shared/email.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Verifica chave secreta
  const secret = request.headers.get('x-cron-secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db  = getDb(env);
  const now = new Date();
  const resultado = { recovery_enviados: 0, pendentes_deletados: 0, usuarios_deletados: 0 };

  // ── 1. E-mails de recuperação (pendentes > 2h, sem e-mail ainda) ────────
  const duasHorasAtras = new Date(now - 2 * 60 * 60 * 1000).toISOString();

  const { data: abandonados } = await db
    .from('purchases')
    .select('user_email, product_id')
    .eq('status', 'pending')
    .is('recovery_sent_at', null)
    .lt('created_at', duasHorasAtras);

  for (const p of (abandonados || [])) {
    try {
      await sendRecoveryEmail(env, p.user_email, p.product_id);
      await db.from('purchases')
        .update({ recovery_sent_at: now.toISOString() })
        .eq('user_email', p.user_email)
        .eq('product_id', p.product_id)
        .eq('status', 'pending');
      resultado.recovery_enviados++;
    } catch (e) { /* continua para o próximo */ }
  }

  // ── 2. Apaga compras pendentes com mais de 7 dias ────────────────────────
  const seteDiasAtras = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: velhos } = await db
    .from('purchases')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', seteDiasAtras);

  if (velhos?.length) {
    const ids = velhos.map(r => r.id);
    await db.from('purchases').delete().in('id', ids);
    resultado.pendentes_deletados = ids.length;
  }

  // ── 3. Apaga usuários sem compras (aprovadas ou pendentes recentes) ───────
  // Usuários criados há mais de 7 dias sem nenhuma compra aprovada
  const { data: semCompra } = await db.rpc('usuarios_sem_compra', {
    dias: 7
  }).catch(() => ({ data: [] }));
  // (função SQL opcional — se não existir, pula silenciosamente)

  if (semCompra?.length) {
    const emails = semCompra.map(u => u.email);
    await db.from('users').delete().in('email', emails);
    resultado.usuarios_deletados = emails.length;
  }

  return new Response(JSON.stringify({ ok: true, ...resultado }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
