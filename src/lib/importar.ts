/* Leitura da lista colada (JSON ou CSV gerado pelo Claude a partir do PDF do fornecedor) + detecção de duplicados. Funções puras. */
import { normTxt } from './formato';
import type { Produto } from './types';
import { ok, sb } from './supabase';

const normRef = (s?: string | null) => normTxt(s).replace(/[\s.\-_/]/g, '');

export interface LinhaImp {
  n: number;
  nome: string;
  ref: string;
  linha: string;
  custo: number | null;
  preco: number | null; // preço de venda final (já com margem quando o arquivo traz custo)
  min: number;
  opcoes: { nome: string; ref: string; preco: number | null }[];
  erro: string | null;
  duplicado: Produto | null;
  dupNoArquivo: boolean;
}

export function numero(v: unknown): number | null {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (v == null) return null;
  let s = String(v).replace(/[^\d.,-]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const x = parseFloat(s);
  return isNaN(x) ? null : x;
}

const pega = (o: Record<string, unknown>, ...k: string[]) => {
  for (const c of k) if (o[c] != null && o[c] !== '') return o[c];
  return undefined;
};

function deObjetos(arr: Record<string, unknown>[]) {
  return arr.map((o) => ({
    nome: String(pega(o, 'nome', 'produto', 'descricao') ?? '').trim(),
    ref: String(pega(o, 'ref', 'sku', 'referencia', 'codigo') ?? '').trim(),
    linha: String(pega(o, 'linha', 'categoria', 'subcategoria') ?? '').trim(),
    custo: numero(pega(o, 'custo', 'preco_custo')),
    preco: numero(pega(o, 'preco', 'preco_venda')),
    min: Math.max(1, Math.round(numero(pega(o, 'min', 'min_mult', 'multiplo', 'minimo')) ?? 1)),
    opcoes: (Array.isArray(o.variacoes) ? (o.variacoes as Record<string, unknown>[]) : []).map((v) => ({
      nome: String(pega(v, 'nome', 'tamanho', 'cor') ?? ''),
      ref: String(pega(v, 'ref', 'sku') ?? ''),
      preco: numero(pega(v, 'custo', 'preco')),
    })),
  }));
}

function deCsv(txt: string) {
  const linhas = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!linhas.length) return [];
  const sep = linhas[0].includes('\t') ? '\t' : linhas[0].includes(';') ? ';' : ',';
  const cab = linhas[0].split(sep).map((c) => normTxt(c));
  const temCab = cab.some((c) => ['nome', 'produto', 'ref', 'sku', 'custo', 'preco'].includes(c));
  const cols = temCab ? cab : ['nome', 'ref', 'custo', 'min'];
  return deObjetos(
    (temCab ? linhas.slice(1) : linhas).map((l) => {
      const v = l.split(sep).map((x) => x.trim());
      return Object.fromEntries(cols.map((c, i) => [c, v[i]]));
    }),
  );
}

export function lerLista(txt: string, opt: { margemTipo: 'pct' | 'fix'; margem: number; valoresSaoCusto: boolean; categoriaId: string; existentes: Produto[] }): { linhas: LinhaImp[]; formato: 'json' | 'csv' | null; erroGeral: string | null } {
  const t = txt.trim();
  if (!t) return { linhas: [], formato: null, erroGeral: null };
  let brutos: ReturnType<typeof deObjetos>;
  let formato: 'json' | 'csv' = 'csv';
  if (t.startsWith('[') || t.startsWith('{')) {
    formato = 'json';
    try {
      const j = JSON.parse(t);
      const arr = Array.isArray(j) ? j : Array.isArray(j.produtos) ? j.produtos : null;
      if (!arr) return { linhas: [], formato, erroGeral: 'O JSON precisa ser uma lista de produtos (ou ter a chave "produtos").' };
      brutos = deObjetos(arr);
    } catch (e) {
      return { linhas: [], formato, erroGeral: 'JSON inválido: ' + (e as Error).message };
    }
  } else brutos = deCsv(t);

  const aplica = (v: number | null) => (v == null ? null : Math.round((opt.margemTipo === 'pct' ? v * (1 + opt.margem / 100) : v + opt.margem) * 100) / 100);
  const daCat = opt.existentes.filter((p) => p.fornecedor_id === opt.categoriaId);
  const vistos = new Set<string>();

  const linhas = brutos.map((b, i): LinhaImp => {
    const custo = opt.valoresSaoCusto ? (b.custo ?? b.preco) : b.custo;
    const preco = opt.valoresSaoCusto ? aplica(custo) : (b.preco ?? aplica(b.custo));
    // Duplicado: mesma referência no mesmo fornecedor; sem referência, mesmo nome no mesmo fornecedor.
    const r = normRef(b.ref);
    const nm = normTxt(b.nome);
    const duplicado = (r ? daCat.find((p) => normRef(p.ref) === r) : daCat.find((p) => normTxt(p.nome) === nm)) ?? null;
    const k = r ? 'ref:' + r : 'nome:' + nm;
    const dupNoArquivo = vistos.has(k);
    vistos.add(k);
    const opcoes = b.opcoes.map((o) => ({ ...o, preco: opt.valoresSaoCusto ? aplica(o.preco) : o.preco }));
    let erro: string | null = null;
    if (!b.nome) erro = 'Sem nome';
    else if (preco == null && !opcoes.length) erro = 'Sem preço/custo';
    return { n: i + 1, nome: b.nome, ref: b.ref, linha: b.linha, custo, preco, min: b.min, opcoes, erro, duplicado, dupNoArquivo };
  });
  return { linhas, formato, erroGeral: null };
}

export const PROMPT_CLAUDE = `Vou te mandar o catálogo PDF de um fornecedor. Extraia TODOS os produtos e me devolva SÓ um JSON (sem comentários), neste formato:
[
  { "nome": "Cobertor Microfibra Casal 1,80x2,00", "ref": "COB-CAS", "linha": "Cobertores", "custo": 12.30, "min": 40,
    "variacoes": [ { "nome": "Azul", "ref": "COB-CAS-AZ", "custo": 12.30 } ] }
]
Regras: "custo" é o preço do PDF (número com ponto). "min" é a quantidade mínima/múltiplo (1 se não tiver).
"variacoes" só quando o mesmo produto tem tamanhos/cores com preço ou código próprio; senão deixe [].
Nome em português, sem CAIXA ALTA, com a medida no final. Não invente referência: deixe "" se não houver.`;

export type AcaoImp = 'criar' | 'atualizar' | 'pular' | 'erro';

/** Grava a importação: cria os novos e atualiza os duplicados escolhidos. Devolve quantos de cada. */
export async function gravarImportacao(linhas: LinhaImp[], acao: (l: LinhaImp) => AcaoImp, fornecedorId: string, margem: { tipo: 'pct' | 'fix'; valor: number }) {
  const base = (l: LinhaImp) => ({
    nome: l.nome,
    ref: l.ref || null,
    categoria: l.linha || null,
    custo: l.custo,
    margem_tipo: margem.tipo,
    margem_val: margem.valor,
    preco: l.preco ?? (l.opcoes.length ? Math.min(...l.opcoes.map((o) => o.preco ?? Infinity)) : null),
    min_mult: l.min,
  });
  const novos = linhas.filter((l) => acao(l) === 'criar');
  const atualizar = linhas.filter((l) => acao(l) === 'atualizar' && l.duplicado);
  let criados = 0;
  for (let i = 0; i < novos.length; i += 100) {
    const lote = novos.slice(i, i + 100);
    const ids = ok(await sb().from('produtos').insert(lote.map((l) => ({ ...base(l), fornecedor_id: fornecedorId }))).select('id')) as { id: string }[];
    const vars = lote.flatMap((l, k) => l.opcoes.map((o) => ({ produto_id: ids[k].id, nome: o.nome || '—', ref: o.ref || null, preco: o.preco ?? base(l).preco ?? 0 })));
    if (vars.length) ok(await sb().from('produto_variacoes').insert(vars));
    criados += lote.length;
  }
  for (const l of atualizar) {
    const d = base(l);
    const upd: Record<string, unknown> = { custo: d.custo, margem_tipo: d.margem_tipo, margem_val: d.margem_val, preco: d.preco, min_mult: d.min_mult };
    if (d.categoria) upd.categoria = d.categoria;
    ok(await sb().from('produtos').update(upd).eq('id', l.duplicado!.id));
    if (l.opcoes.length) {
      ok(await sb().from('produto_variacoes').delete().eq('produto_id', l.duplicado!.id));
      ok(await sb().from('produto_variacoes').insert(l.opcoes.map((o) => ({ produto_id: l.duplicado!.id, nome: o.nome || '—', ref: o.ref || null, preco: o.preco ?? d.preco ?? 0 }))));
    }
  }
  return { criados, atualizados: atualizar.length };
}
