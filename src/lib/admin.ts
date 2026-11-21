/* Operações do painel (exigem login). Mesmas regras do app antigo, organizadas em funções. */
import { apagarArquivos } from './fotos';
import { ok, sb } from './supabase';
import type { Cliente, Cotacao, CotacaoItem, Fornecedor, Lancamento, Parcela, Pedido, PedidoItem, Produto, StatusPedido } from './types';

const n = (v: unknown) => (v == null ? 0 : Number(v));
export const hojeISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};
export const somaDias = (iso: string, dias: number) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};
const uuid = () => crypto.randomUUID();

/* ---------------- clientes ---------------- */
export async function listarClientes(): Promise<Cliente[]> {
  return ok(await sb().from('clientes').select('*').order('nome')) as Cliente[];
}
export type ClienteForm = Omit<Cliente, 'id' | 'criado_em' | 'ja_pediu'>;
export async function salvarCliente(id: string | null, d: ClienteForm) {
  if (id) ok(await sb().from('clientes').update(d).eq('id', id));
  else ok(await sb().from('clientes').insert(d));
}
export async function excluirCliente(id: string) {
  ok(await sb().from('clientes').delete().eq('id', id));
}
/** Cadastro público (anon só pode inserir — sem .select()). */
export async function cadastroPublico(d: ClienteForm) {
  ok(await sb().from('clientes').insert(d));
}

/* ---------------- fornecedores (= categorias) ---------------- */
export async function salvarFornecedor(id: string | null, d: Pick<Fornecedor, 'nome' | 'logo' | 'cor' | 'pedido_minimo'>) {
  if (id) ok(await sb().from('fornecedores').update(d).eq('id', id));
  else ok(await sb().from('fornecedores').insert(d));
}
export async function excluirFornecedor(id: string, produtos: Produto[]) {
  const fotos = produtos.filter((p) => p.fornecedor_id === id).flatMap((p) => p.produto_fotos.map((f) => f.url));
  ok(await sb().from('fornecedores').delete().eq('id', id)); // cascata apaga produtos/variações/faixas/fotos
  await apagarArquivos(fotos);
}

/* ---------------- produtos ---------------- */
export interface ProdutoForm {
  fornecedor_id: string;
  nome: string;
  ref: string | null;
  categoria: string | null;
  custo: number | null;
  margem_tipo: 'pct' | 'fix';
  margem_val: number | null;
  preco: number | null;
  min_mult: number;
}
export async function salvarProduto(id: string | null, d: ProdutoForm, vars: { nome: string; ref: string | null; preco: number }[], faixas: { min_valor: number; preco: number }[]): Promise<string> {
  let pid = id;
  if (pid) ok(await sb().from('produtos').update(d).eq('id', pid));
  else pid = (ok(await sb().from('produtos').insert(d).select('id').single()) as { id: string }).id;
  // variações e faixas: substitui o conjunto (simples e previsível)
  ok(await sb().from('produto_variacoes').delete().eq('produto_id', pid));
  if (vars.length) ok(await sb().from('produto_variacoes').insert(vars.map((v) => ({ ...v, produto_id: pid }))));
  ok(await sb().from('produto_faixas').delete().eq('produto_id', pid));
  if (faixas.length) ok(await sb().from('produto_faixas').insert(faixas.map((f) => ({ ...f, produto_id: pid }))));
  return pid!;
}
/** Grava a galeria na ordem dada; a 1ª vira a capa (produtos.img_url). */
export async function salvarFotos(pid: string, urls: string[], removidas: string[]) {
  ok(await sb().from('produto_fotos').delete().eq('produto_id', pid));
  if (urls.length) ok(await sb().from('produto_fotos').insert(urls.map((url, ordem) => ({ produto_id: pid, url, ordem }))));
  ok(await sb().from('produtos').update({ img_url: urls[0] ?? null }).eq('id', pid));
  if (removidas.length) await apagarArquivos(removidas);
}
export async function excluirProduto(p: Produto) {
  ok(await sb().from('produtos').delete().eq('id', p.id));
  await apagarArquivos(p.produto_fotos.map((f) => f.url));
}
/** Acrescenta uma foto na posição "ordem" da galeria (importação de fotos em lote). A 1ª vira a capa. */
export async function acrescentarFoto(produtoId: string, url: string, ordem: number) {
  ok(await sb().from('produto_fotos').insert({ produto_id: produtoId, url, ordem }));
  if (ordem === 0) ok(await sb().from('produtos').update({ img_url: url }).eq('id', produtoId));
}

/* ---------------- cotações ---------------- */
export async function listarCotacoes(): Promise<Cotacao[]> {
  const d = ok(await sb().from('cotacoes').select('*,cotacao_itens(*)').order('criado_em', { ascending: false })) as Cotacao[];
  return d.map((c) => ({ ...c, cotacao_itens: c.cotacao_itens.map((i) => ({ ...i, preco: n(i.preco) })) }));
}
export const valorCotacao = (c: Cotacao) => c.cotacao_itens.reduce((a, i) => a + i.qtd * i.preco, 0);
export async function addItemCotacao(cotacao_id: string, i: Omit<CotacaoItem, 'id' | 'cotacao_id'>) {
  ok(await sb().from('cotacao_itens').insert({ ...i, cotacao_id }));
}
export async function qtdItemCotacao(id: string, qtd: number) {
  if (qtd < 1) ok(await sb().from('cotacao_itens').delete().eq('id', id));
  else ok(await sb().from('cotacao_itens').update({ qtd }).eq('id', id));
}
export async function excluirCotacao(id: string) {
  ok(await sb().from('cotacoes').delete().eq('id', id));
}

/* ---------------- pedidos ---------------- */
export async function listarPedidos(): Promise<Pedido[]> {
  const d = ok(await sb().from('pedidos').select('*,pedido_itens(*),parcelas(*)').order('criado_em', { ascending: false })) as Pedido[];
  return d.map(normalizaPedido);
}
export async function lerPedido(id: string): Promise<Pedido> {
  return normalizaPedido(ok(await sb().from('pedidos').select('*,pedido_itens(*),parcelas(*)').eq('id', id).single()) as Pedido);
}
function normalizaPedido(p: Pedido): Pedido {
  return {
    ...p,
    status: (p.status || 'aberto') as StatusPedido,
    pedido_itens: (p.pedido_itens ?? []).map((i) => ({ ...i, preco: n(i.preco), custo: i.custo == null ? null : n(i.custo) })).sort((a, b) => a.produto_nome.localeCompare(b.produto_nome, 'pt-BR')),
    parcelas: (p.parcelas ?? []).map((x) => ({ ...x, valor: n(x.valor), comissao: n(x.comissao) })).sort((a, b) => a.numero - b.numero),
  };
}
/** Próximo número (#1001, #1002…) olhando o maior já usado — não repete se algum pedido for apagado. */
async function proximosNumeros(qtd: number): Promise<string[]> {
  const d = ok(await sb().from('pedidos').select('numero')) as { numero: string | null }[];
  let max = 1000;
  for (const r of d) {
    const x = parseInt((r.numero || '').replace(/\D/g, ''), 10);
    if (x > max) max = x;
  }
  return Array.from({ length: qtd }, (_, k) => '#' + (max + 1 + k));
}
export interface ItemNovo { produto_nome: string; ref: string | null; fornecedor: string; qtd: number; preco: number; custo: number | null }
/** Cria um pedido por fornecedor (igual ao app antigo) e marca o cliente como "já pediu". */
export async function criarPedidos(cliente_nome: string, itens: ItemNovo[]): Promise<string[]> {
  const grupos = new Map<string, ItemNovo[]>();
  itens.forEach((i) => grupos.set(i.fornecedor || 'Sem fornecedor', [...(grupos.get(i.fornecedor || 'Sem fornecedor') ?? []), i]));
  const nums = await proximosNumeros(grupos.size);
  let k = 0;
  for (const [forn, its] of [...grupos].sort((x, y) => x[0].localeCompare(y[0], 'pt-BR'))) {
    const id = uuid();
    ok(await sb().from('pedidos').insert({ id, numero: nums[k++], cliente_nome, fornecedor: forn, status: 'aberto', data: hojeISO() }));
    ok(await sb().from('pedido_itens').insert(its.map((i) => ({ ...i, fornecedor: forn, pedido_id: id }))));
  }
  await sb().from('clientes').update({ ja_pediu: true }).eq('nome', cliente_nome);
  return nums;
}
export async function gerarPedidoDaCotacao(c: Cotacao, produtos: Produto[]): Promise<string[]> {
  const porRef = new Map(produtos.filter((p) => p.ref).map((p) => [p.ref!.toLowerCase(), p]));
  produtos.forEach((p) => p.produto_variacoes.forEach((v) => v.ref && porRef.set(v.ref.toLowerCase(), p)));
  const porNome = new Map(produtos.map((p) => [p.nome.toLowerCase(), p]));
  const custoDe = (i: CotacaoItem) => {
    const p = porRef.get((i.ref || '').toLowerCase()) ?? porNome.get(i.produto_nome.toLowerCase().replace(/ \([^)]*\)$/, ''));
    return p ? p.custo : null; // variação não tem custo próprio no banco: usa o do produto
  };
  const nums = await criarPedidos(
    c.cliente_nome,
    c.cotacao_itens.map((i) => ({ produto_nome: i.produto_nome, ref: i.ref, fornecedor: i.fornecedor || 'Sem fornecedor', qtd: i.qtd, preco: i.preco, custo: custoDe(i) })),
  );
  ok(await sb().from('cotacoes').update({ status: 'pedido' }).eq('id', c.id));
  return nums;
}
export async function mudarStatus(id: string, status: StatusPedido) {
  ok(await sb().from('pedidos').update({ status }).eq('id', id));
}
export async function salvarTransportadora(id: string, transportadora: string | null) {
  ok(await sb().from('pedidos').update({ transportadora }).eq('id', id));
}
export async function excluirPedido(id: string) {
  ok(await sb().from('pedidos').delete().eq('id', id));
}
export async function addItemPedido(pedido_id: string, i: ItemNovo) {
  ok(await sb().from('pedido_itens').insert({ ...i, pedido_id }));
}
export async function qtdItemPedido(id: string, qtd: number) {
  if (qtd < 1) ok(await sb().from('pedido_itens').delete().eq('id', id));
  else ok(await sb().from('pedido_itens').update({ qtd }).eq('id', id));
}
export const valorPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + i.qtd * i.preco, 0);
export const comissaoPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + (i.custo != null ? (i.preco - i.custo) * i.qtd : 0), 0);
export const unidadesPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + i.qtd, 0);

/* ---------------- parcelas / financeiro ---------------- */
export function calcularParcelas(tot: number, com: number, qtd: number, primeira: string, intervalo: number) {
  const vP = Math.round((tot / qtd) * 100) / 100;
  const cP = Math.round((com / qtd) * 100) / 100;
  return Array.from({ length: qtd }, (_, i) => ({
    numero: i + 1,
    total: qtd,
    vencimento: somaDias(primeira, i * intervalo),
    valor: i === qtd - 1 ? Math.round((tot - vP * (qtd - 1)) * 100) / 100 : vP,
    comissao: i === qtd - 1 ? Math.round((com - cP * (qtd - 1)) * 100) / 100 : cP,
  }));
}
export async function gerarParcelas(p: Pedido, qtd: number, primeira: string, intervalo: number) {
  ok(await sb().from('parcelas').insert(calcularParcelas(valorPedido(p), comissaoPedido(p), qtd, primeira, intervalo).map((x) => ({ ...x, pedido_id: p.id }))));
}
export async function refazerParcelas(pedidoId: string) {
  ok(await sb().from('parcelas').delete().eq('pedido_id', pedidoId));
}
export async function marcarRecebido(tabela: 'parcelas' | 'lancamentos', id: string, recebido: boolean) {
  ok(await sb().from(tabela).update({ recebido, recebido_em: recebido ? hojeISO() : null }).eq('id', id));
}
export async function listarLancamentos(): Promise<Lancamento[]> {
  return (ok(await sb().from('lancamentos').select('*')) as Lancamento[]).map((l) => ({ ...l, valor: n(l.valor), comissao: n(l.comissao) }));
}
export async function novoLancamento(d: Omit<Lancamento, 'id' | 'recebido' | 'recebido_em'>) {
  ok(await sb().from('lancamentos').insert(d));
}
export async function excluirLancamento(id: string) {
  ok(await sb().from('lancamentos').delete().eq('id', id));
}

export interface Recebivel {
  tipo: 'parcela' | 'avulso';
  id: string;
  pedido_id?: string;
  data: string | null;
  cliente: string;
  titulo: string;
  sub: string;
  valor: number;
  comissao: number;
  recebido: boolean;
}
export function recebiveis(pedidos: Pedido[], lancs: Lancamento[]): Recebivel[] {
  const out: Recebivel[] = [];
  pedidos
    .filter((p) => p.status !== 'cancelado')
    .forEach((p) =>
      p.parcelas.forEach((pc: Parcela) =>
        out.push({ tipo: 'parcela', id: pc.id, pedido_id: p.id, data: pc.vencimento, cliente: p.cliente_nome, titulo: `${p.numero ?? ''} (${pc.numero}/${pc.total})`, sub: [p.fornecedor, p.transportadora && '🚚 ' + p.transportadora].filter(Boolean).join(' · '), valor: pc.valor, comissao: pc.comissao, recebido: !!pc.recebido }),
      ),
    );
  lancs.forEach((l) => out.push({ tipo: 'avulso', id: l.id, data: l.vencimento, cliente: l.cliente_nome || l.descricao || '—', titulo: 'avulso', sub: [l.pedido_numero && 'Pedido ' + l.pedido_numero, l.descricao].filter(Boolean).join(' · '), valor: l.valor, comissao: l.comissao, recebido: !!l.recebido }));
  return out;
}

export type { PedidoItem };
