/* Regras de preço do catálogo — mesmas do app atual (index.html): faixas por valor do pedido no fornecedor; variação não usa faixa. */
import type { Fornecedor, Produto } from './types';

export const temVariacao = (p: Produto) => p.produto_variacoes.length > 0;
export const precoBase = (p: Produto) => (temVariacao(p) ? Math.min(...p.produto_variacoes.map((v) => v.preco)) : (p.preco ?? 0));
export const menorPreco = (p: Produto) =>
  Math.min(precoBase(p), ...p.produto_faixas.map((f) => f.preco));
export const multiplo = (p: Produto) => Math.max(1, p.min_mult || 1);
export const arredondaMultiplo = (q: number, m: number) => Math.max(m, Math.ceil(q / m) * m);

export interface ItemCarrinho {
  chave: string; // produtoId ou produtoId#variacaoId
  qtd: number;
}

export interface LinhaCalc {
  chave: string;
  produto: Produto;
  variacao: Produto['produto_variacoes'][number] | null;
  nome: string;
  ref: string | null;
  qtd: number;
  precoBase: number;
  preco: number;
}
export interface GrupoCalc {
  fornecedor: Fornecedor;
  linhas: LinhaCalc[];
  subBase: number;
  total: number;
  proxFaixa: number | null; // valor (subtotal) que destrava o próximo preço melhor
  faltaMinimo: number; // quanto falta para o pedido mínimo
}

export function calcular(itens: ItemCarrinho[], produtos: Produto[], fornecedores: Fornecedor[]) {
  const grupos = new Map<string, GrupoCalc>();
  for (const it of itens) {
    const [pid, vid] = it.chave.split('#');
    const p = produtos.find((x) => x.id === pid);
    if (!p) continue;
    const v = vid ? (p.produto_variacoes.find((x) => x.id === vid) ?? null) : null;
    const f = fornecedores.find((x) => x.id === p.fornecedor_id)!;
    const g = grupos.get(f.id) ?? { fornecedor: f, linhas: [], subBase: 0, total: 0, proxFaixa: null, faltaMinimo: 0 };
    const base = v ? v.preco : (p.preco ?? 0);
    g.linhas.push({ chave: it.chave, produto: p, variacao: v, nome: p.nome + (v ? ` (${v.nome})` : ''), ref: v?.ref ?? p.ref, qtd: it.qtd, precoBase: base, preco: base });
    g.subBase += base * it.qtd;
    grupos.set(f.id, g);
  }
  for (const g of grupos.values()) {
    let prox = Infinity;
    for (const l of g.linhas) {
      if (!l.variacao) {
        for (const fx of [...l.produto.produto_faixas].sort((a, b) => a.min_valor - b.min_valor)) {
          if (g.subBase >= fx.min_valor) l.preco = fx.preco;
          else if (fx.min_valor < prox) prox = fx.min_valor;
        }
      }
      g.total += l.preco * l.qtd;
    }
    g.proxFaixa = prox === Infinity ? null : prox;
    g.faltaMinimo = g.fornecedor.pedido_minimo ? Math.max(0, g.fornecedor.pedido_minimo - g.subBase) : 0;
  }
  const lista = [...grupos.values()];
  return { grupos: lista, total: lista.reduce((a, g) => a + g.total, 0), unidades: itens.reduce((a, i) => a + i.qtd, 0) };
}
