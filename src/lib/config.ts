/* Configuração pública (vai no JS do navegador — só chaves públicas). Variáveis de build com valor padrão. */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xhifutmfnkogmikeoojx.supabase.co').replace(/\/$/, '');
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_44gYPJyLJ4CWITx4fPWOUA_7efw_Wtf';
export const WHATSAPP_REP = process.env.NEXT_PUBLIC_WHATSAPP_REP || '5583981039267';
export const BUCKET = 'produtos';
/** Fotos novas ganham nome novo a cada envio, então podem ficar 1 ano no cache do navegador/CDN. */
export const CACHE_FOTO = '31536000';
