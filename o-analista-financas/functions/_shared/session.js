// Lê o cookie de sessão e devolve o e-mail do usuário, ou null
export function getSessionToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const part = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('fd_session='));
  return part ? part.slice('fd_session='.length) : null;
}

export async function getSessionEmail(db, request) {
  const token = getSessionToken(request);
  if (!token) return null;
  const { data } = await db.from('sessions').select('email, expires_at').eq('token', token).maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data.email;
}
