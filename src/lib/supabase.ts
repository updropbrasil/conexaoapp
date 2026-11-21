import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON, SUPABASE_URL } from './config';

let cliente: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!cliente) cliente = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'conexao-auth' } });
  return cliente;
}

/** Lança o erro do Supabase com mensagem em português quando possível. */
export function ok<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw new Error(traduz(r.error));
  return r.data;
}
export function traduz(e: { message: string; code?: string }) {
  const m = e.message || '';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/row-level security/i.test(m)) return 'Sem permissão — entre de novo no painel.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
  if (/JWT expired/i.test(m)) return 'Sessão expirada — entre de novo.';
  return m;
}
/** Tabela/coluna ainda não criada (migração pendente): o app segue com o padrão. */
export const faltaNoBanco = (e: { code?: string; message?: string } | null) => !!e && (['42P01', 'PGRST205', 'PGRST204', '42703'].includes(e.code || '') || /does not exist|schema cache/i.test(e.message || ''));
