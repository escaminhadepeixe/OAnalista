// GET /api/stats
// Retorna contagem de leitores e estatísticas de avaliações por produto
import { getDb } from '../_shared/db.js';

export async function onRequestGet(context) {
  const { env } = context;
  const db = getDb(env);

  const produtos = ['financas', 'cripto'];
  const resultado = { total_leitores: 0 };

  for (const produto of produtos) {
    // Conta leitores (compras aprovadas)
    const { count: leitores } = await db
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', produto)
      .eq('status', 'approved');

    // Busca avaliações aprovadas para calcular média
    const { data: reviews } = await db
      .from('reviews')
      .select('rating')
      .eq('product_id', produto)
      .eq('approved', true);

    const total_reviews = reviews?.length || 0;
    const avg = total_reviews > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / total_reviews).toFixed(1)
      : null;

    resultado[produto] = {
      leitores:    leitores || 0,
      reviews:     total_reviews,
      avg_rating:  avg
    };
    resultado.total_leitores += (leitores || 0);
  }

  return new Response(JSON.stringify(resultado), {
    headers: { 'Content-Type': 'application/json' }
  });
}
