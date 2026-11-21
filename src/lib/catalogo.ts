/* Leitura pública do catálogo + cache no aparelho (abre na hora e atualiza por trás). */
import { sb } from './supabase';
import type { Fornecedor, Produto } from './types';

const CHAVE = 'conexao.catalogo.v2';
// O catálogo público não lê custo/margem.
const COLS_PUB = 'id,fornecedor_id,nome,ref,preco,img_url,min_mult,categoria,criado_em,produto_variacoes(*),produto_faixas(*),produto_fotos(*)';

export interface Catalogo {
  fornecedores: Fornecedor[];
  produtos: Produto[];
}

export function catalogoEmCache(): Catalogo | null {
  try {
    const s = localStorage.getItem(CHAVE);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const TAMANHOS = ['RN', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'EG', 'EGG', 'G1', 'G2', 'G3', 'G4'];
/** Tamanhos na ordem de loja (PP, P, M, G, GG…); números em ordem numérica; o resto em ordem alfabética. */
export function ordemVariacao(a: { nome: string }, b: { nome: string }) {
  const ia = TAMANHOS.indexOf(a.nome.trim().toUpperCase());
  const ib = TAMANHOS.indexOf(b.nome.trim().toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0 || ib >= 0) return ia >= 0 ? -1 : 1;
  return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true });
}

export function normalizaProduto(p: Partial<Produto> & { id: string }): Produto {
  return {
    emoji: null,
    custo: null,
    margem_tipo: null,
    margem_val: null,
    ...p,
    produto_variacoes: [...(p.produto_variacoes ?? [])].map((v) => ({ ...v, preco: Number(v.preco) })).sort(ordemVariacao),
    produto_faixas: [...(p.produto_faixas ?? [])].map((f) => ({ ...f, min_valor: Number(f.min_valor), preco: Number(f.preco) })).sort((a, b) => a.min_valor - b.min_valor),
    produto_fotos: [...(p.produto_fotos ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
  } as Produto;
}

export async function carregarCatalogo(admin = false): Promise<Catalogo> {
  const [f, p] = await Promise.all([
    sb().from('fornecedores').select('*').order('nome'),
    sb().from('produtos').select(admin ? '*,produto_variacoes(*),produto_faixas(*),produto_fotos(*)' : COLS_PUB).order('nome'),
  ]);
  if (f.error) throw f.error;
  if (p.error) throw p.error;
  const cat: Catalogo = {
    fornecedores: (f.data ?? []).map((x) => ({ ...x, pedido_minimo: x.pedido_minimo == null ? null : Number(x.pedido_minimo) })),
    produtos: ((p.data ?? []) as unknown as Produto[]).map((x) => normalizaProduto({ ...x, preco: x.preco == null ? null : Number(x.preco), custo: x.custo == null ? null : Number(x.custo) })),
  };
  if (!admin) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(cat));
    } catch {}
  }
  return cat;
}

/** "Chegou agora": cadastrados nos últimos 15 dias. */
export const ehNovo = (p: Produto) => !!p.criado_em && Date.now() - new Date(p.criado_em).getTime() < 15 * 864e5;
