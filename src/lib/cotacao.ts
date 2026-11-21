/* Envio da cotação pelo catálogo público (sem login: o anon só pode INSERIR em cotacoes/cotacao_itens). */
import { WHATSAPP_REP } from './config';
import { dinheiro } from './formato';
import type { calcular } from './preco';
import { ok, sb } from './supabase';

export async function enviarCotacao(nome: string, tel: string, tipo: 'cotacao' | 'pedido', resumo: ReturnType<typeof calcular>) {
  const id = crypto.randomUUID(); // id gerado aqui porque o anon não pode ler a linha depois de inserir
  const itens = resumo.grupos.flatMap((g) => g.linhas.map((l) => ({ cotacao_id: id, produto_nome: l.nome, ref: l.ref, fornecedor: g.fornecedor.nome, qtd: l.qtd, preco: l.preco })));
  ok(await sb().from('cotacoes').insert({ id, cliente_nome: nome, cliente_tel: tel, status: tipo === 'pedido' ? 'fechar' : 'pendente' }));
  ok(await sb().from('cotacao_itens').insert(itens));

  let msg = `*${tipo === 'pedido' ? 'Novo PEDIDO' : 'Nova cotação'} — Conexão Indústria & Varejo*\n\n*Cliente:* ${nome}\n*Contato:* ${tel}`;
  for (const g of resumo.grupos) {
    msg += `\n\n*${g.fornecedor.nome}:*\n`;
    for (const l of g.linhas) msg += `• ${l.qtd}x ${l.nome} — ${dinheiro(l.preco)}\n`;
  }
  msg += `\n*Total estimado:* ${dinheiro(resumo.total)}`;
  return `https://wa.me/${WHATSAPP_REP}?text=${encodeURIComponent(msg)}`;
}
