/* Aparência: banner + tema de cor, guardados na tabela config (se ela existir). */
import { faltaNoBanco, sb } from './supabase';

export interface Tema { id: string; nome: string; tinta: string; tinta2: string; marca: string; marcaClaro: string }
export const TEMAS: Tema[] = [
  { id: 'conexao', nome: 'Conexão', tinta: '#0c1f4f', tinta2: '#15306e', marca: '#1c45ad', marcaClaro: '#e8eefb' },
  { id: 'azul', nome: 'Azul vivo', tinta: '#14559b', tinta2: '#1d6fc4', marca: '#1d6fc4', marcaClaro: '#e6f0fb' },
  { id: 'verde', nome: 'Verde', tinta: '#24561a', tinta2: '#2f6f22', marca: '#37711f', marcaClaro: '#eaf5e4' },
  { id: 'grafite', nome: 'Grafite', tinta: '#1f2937', tinta2: '#374151', marca: '#374151', marcaClaro: '#eef0f3' },
  { id: 'vinho', nome: 'Vinho', tinta: '#5e1428', tinta2: '#7a1f3a', marca: '#9b2c4d', marcaClaro: '#f8e9ee' },
];

export interface Aparencia { banner_url: string; tema: string }
const CHAVE = 'conexao.aparencia';
export const PADRAO: Aparencia = { banner_url: '', tema: 'conexao' };

export function aplicarTema(id: string) {
  const t = TEMAS.find((x) => x.id === id) ?? TEMAS[0];
  const r = document.documentElement.style;
  r.setProperty('--color-tinta', t.tinta);
  r.setProperty('--color-tinta-2', t.tinta2);
  r.setProperty('--color-marca', t.marca);
  r.setProperty('--color-marca-claro', t.marcaClaro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.tinta);
}

export function aparenciaEmCache(): Aparencia {
  try {
    return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) || '{}') };
  } catch {
    return PADRAO;
  }
}

/** Lê a config. Se a tabela ainda não existir (migração 001 pendente), devolve o padrão sem erro. */
export async function carregarAparencia(): Promise<{ ap: Aparencia; tabelaExiste: boolean }> {
  const { data, error } = await sb().from('config').select('chave,valor');
  if (error) return { ap: aparenciaEmCache(), tabelaExiste: !faltaNoBanco(error) };
  const ap = { ...PADRAO };
  for (const r of data ?? []) {
    if (r.chave === 'banner_url') ap.banner_url = r.valor ?? '';
    if (r.chave === 'tema') {
      try {
        // compatível com o formato antigo ({a,e,a2}) — cai no padrão
        ap.tema = TEMAS.some((t) => t.id === r.valor) ? r.valor : 'conexao';
      } catch {}
    }
  }
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ap));
  } catch {}
  return { ap, tabelaExiste: true };
}

export async function salvarAparencia(chave: keyof Aparencia, valor: string) {
  const { error } = await sb().from('config').upsert({ chave, valor });
  if (error) throw new Error(faltaNoBanco(error) ? 'A tabela "config" ainda não existe no Supabase. Rode o arquivo supabase/migrations/001_config_e_fotos.sql.' : error.message);
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...aparenciaEmCache(), [chave]: valor }));
  } catch {}
}
