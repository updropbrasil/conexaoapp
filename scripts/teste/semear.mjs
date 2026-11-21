// Preenche o "Supabase local" de testes com os dados de exemplo (via supabase-js, logado como o representante).
// Uso: node --experimental-strip-types scripts/teste/semear.mjs   (depois de scripts/teste/subir.sh)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { fornecedores, produtos, clientes, pedidos } from './dados.ts';

const URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const sb = createClient(URL, 'sb_publishable_teste', { auth: { persistSession: false } });
const ok = (r, o) => {
  if (r.error) throw new Error(o + ': ' + r.error.message);
  return r.data;
};
ok(await sb.auth.signInWithPassword({ email: 'representante@teste.com', password: 'senha-teste' }), 'login');

const id = (s) => {
  const h = crypto.createHash('md5').update(s).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const SEM_PRODUTOS = process.env.SEM_PRODUTOS === '1';

ok(await sb.from('fornecedores').insert(fornecedores.map((f) => ({ ...f, id: id(f.id) }))), 'fornecedores');
if (!SEM_PRODUTOS) {
  ok(await sb.from('produtos').insert(produtos.map((p) => ({ id: id(p.id), fornecedor_id: id(p.fornecedor_id), nome: p.nome, ref: p.ref, preco: p.preco, min_mult: p.min_mult, custo: p.custo, margem_tipo: p.margem_tipo, margem_val: p.margem_val, categoria: p.categoria, criado_em: p.criado_em }))), 'produtos');
  const vars = produtos.flatMap((p) => p.produto_variacoes.map((v) => ({ id: id(v.id), produto_id: id(p.id), nome: v.nome, ref: v.ref, preco: v.preco })));
  if (vars.length) ok(await sb.from('produto_variacoes').insert(vars), 'variações');
  const fx = produtos.flatMap((p) => p.produto_faixas.map((f) => ({ produto_id: id(p.id), min_valor: f.min_valor, preco: f.preco })));
  if (fx.length) ok(await sb.from('produto_faixas').insert(fx), 'faixas');
  // fotos: já estão em 1200px e 300px (WebP) — sobe as duas e grava a galeria
  const st = sb.storage.from('produtos');
  for (const p of produtos) {
    const urls = [];
    for (const f of p.produto_fotos) {
      const nome = f.url.split('/').pop(); // ex.: cob-rolinho-1.webp
      const n = nome.replace('.webp', '').split('-').pop();
      for (const [arq, destino] of [[nome, `${id(p.id)}/${n}.webp`], [nome.replace('.webp', '-300.webp'), `${id(p.id)}/${n}-300.webp`]]) {
        ok(await st.upload(destino, new Blob([readFileSync(join(import.meta.dirname, 'fotos', arq))], { type: 'image/webp' }), { cacheControl: '31536000', contentType: 'image/webp' }), 'upload ' + destino);
      }
      urls.push(st.getPublicUrl(`${id(p.id)}/${n}.webp`).data.publicUrl);
    }
    if (urls.length) {
      ok(await sb.from('produto_fotos').insert(urls.map((url, ordem) => ({ produto_id: id(p.id), url, ordem }))), 'fotos');
      ok(await sb.from('produtos').update({ img_url: urls[0] }).eq('id', id(p.id)), 'capa');
    }
  }
}
ok(await sb.from('clientes').insert(clientes.map(({ id: _i, ...c }) => c)), 'clientes');
if (!SEM_PRODUTOS) {
  for (const p of pedidos) {
    ok(await sb.from('pedidos').insert({ id: id(p.id), numero: p.numero, cliente_nome: p.cliente_nome, fornecedor: p.fornecedor, status: p.status, data: p.data, criado_em: p.criado_em, transportadora: p.transportadora }), 'pedido');
    ok(await sb.from('pedido_itens').insert(p.pedido_itens.map(({ id: _i, pedido_id: _p, ...i }) => ({ ...i, pedido_id: id(p.id) }))), 'itens');
    if (p.parcelas.length) ok(await sb.from('parcelas').insert(p.parcelas.map(({ id: _i, pedido_id: _p, ...x }) => ({ ...x, pedido_id: id(p.id) }))), 'parcelas');
  }
}
if (!SEM_PRODUTOS) {
  // cotações enviadas pelo catálogo (anônimo) e recebimentos avulsos do mês
  const anon = createClient(URL, 'sb_publishable_teste', { auth: { persistSession: false } });
  const prodRef = (r) => produtos.find((x) => x.ref === r);
  const cots = [
    ['Empório Sol Nascente', '(83) 90000-0014', 'fechar', [['COB-CAN-CAS', 40], ['MAN-CER-180', 40]]],
    ['Mercadinho Bom Preço', '(83) 90000-0018', 'pendente', [['CAB-AVE', 400], ['ORG-24', 100], ['CX-PIED', 100]]],
  ];
  for (const [nome, tel, status, its] of cots) {
    const cid = crypto.randomUUID();
    ok(await anon.from('cotacoes').insert({ id: cid, cliente_nome: nome, cliente_tel: tel, status }), 'cotação');
    ok(await anon.from('cotacao_itens').insert(its.map(([r, qtd]) => ({ cotacao_id: cid, produto_nome: prodRef(r).nome, ref: r, fornecedor: fornecedores.find((f) => f.id === prodRef(r).fornecedor_id).nome, qtd, preco: prodRef(r).preco }))), 'itens cotação');
  }
  ok(await sb.from('lancamentos').insert([
    { descricao: 'Comissão avulsa', cliente_nome: 'Variedades Central', valor: 480, comissao: 48, vencimento: '2026-11-10', recebido: true, recebido_em: '2026-11-10' },
    { descricao: 'Acerto de frete', cliente_nome: 'Loja Estrela do Mar', valor: 690, comissao: 69, vencimento: '2026-11-25' },
    { descricao: 'Saldo pedido anterior', cliente_nome: 'Armarinho Boa Vista', valor: 1250, comissao: 125, vencimento: '2026-11-28' },
  ]), 'lançamentos');
}
console.log(`semeado: ${fornecedores.length} categorias, ${SEM_PRODUTOS ? 0 : produtos.length} produtos, ${clientes.length} clientes, ${SEM_PRODUTOS ? 0 : pedidos.length} pedidos`);
