// Retorna um cliente Supabase usando as variáveis de ambiente do Cloudflare
import { createClient } from '@supabase/supabase-js';

export function getDb(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}
