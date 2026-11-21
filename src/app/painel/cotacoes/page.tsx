'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { BuscaProduto } from '@/components/BuscaProduto';
import { Folha } from '@/components/Folha';
import { Icone, IconeWhats } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import * as A from '@/lib/admin';
import { dinheiro } from '@/lib/formato';
import type { Cotacao } from '@/lib/types';
import { soDigitos } from '@/lib/validacao';

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const ST = {
  pendente: { t: 'Cotação', cls: 'bg-[#fff4d6] text-[#8a5a00]' },
  fechar: { t: 'Quer fechar', cls: 'bg-folha text-white' },
  pedido: { t: 'Virou pedido', cls: 'bg-areia text-suave' },
};

export default function Cotacoes() {
  const { produtos, fornecedores, avisar, falhar } = useAdmin();
  const router = useRouter();
  const [cots, setCots] = useState<Cotacao[] | null>(null);
  const [ver, setVer] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const carregar = useCallback(() => A.listarCotacoes().then(setCots).catch(falhar), [falhar]);
  useEffect(() => {
    carregar();
  }, [carregar]);
  const c = cots?.find((x) => x.id === ver) ?? null;
  const abertas = (cots ?? []).filter((x) => x.status !== 'pedido').length;

  const whats = (c: Cotacao) => {
    let t = soDigitos(c.cliente_tel);
    if (!t) return alert('Esta cotação não tem WhatsApp do cliente.');
    if (t.length <= 11) t = '55' + t;
    let msg = `Olá ${c.cliente_nome}! Tudo bem? Sobre sua cotação na Conexão Indústria & Varejo:\n`;
    const g: Record<string, typeof c.cotacao_itens> = {};
    c.cotacao_itens.forEach((i) => (g[i.fornecedor || '—'] = [...(g[i.fornecedor || '—'] ?? []), i]));
    Object.entries(g).forEach(([f, its]) => {
      msg += `\n*${f}:*\n`;
      its.forEach((i) => (msg += `• ${i.qtd}x ${i.produto_nome} — ${dinheiro(i.preco)}\n`));
    });
    msg += `\n*Total estimado:* ${dinheiro(A.valorCotacao(c))}\n\nPodemos seguir com o pedido?`;
    window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const acao = async (f: () => Promise<unknown>) => {
    try {
      await f();
      await carregar();
    } catch (e) {
      falhar(e);
    }
  };
  const gerar = async (c: Cotacao) => {
    if (!c.cotacao_itens.length) return alert('Cotação sem itens.');
    setGerando(true);
    try {
      const nums = await A.gerarPedidoDaCotacao(c, produtos);
      avisar(`${nums.length} pedido(s): ${nums.join(', ')}`);
      router.push('/painel/pedidos/');
    } catch (e) {
      falhar(e);
    } finally {
      setGerando(false);
    }
  };

  return (
    <>
      <PainelTopo titulo="Cotações" sub={cots ? `${abertas} em aberto` : ''} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        {cots === null ? (
          <p className="py-10 text-center text-suave">Carregando…</p>
        ) : !cots.length ? (
          <div className="cartao grid place-items-center gap-1 px-6 py-12 text-center">
            <Icone n="doc" className="size-8 text-suave/60" />
            <p className="font-semibold text-tinta">Nenhuma cotação ainda</p>
            <p className="text-sm text-suave">Quando um cliente enviar pelo catálogo, ela aparece aqui.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {cots.map((c) => {
              const s = ST[c.status] ?? ST.pendente;
              const un = c.cotacao_itens.reduce((a, i) => a + i.qtd, 0);
              return (
                <li key={c.id} className={`cartao p-3.5 sm:p-4 ${c.status === 'pedido' ? 'opacity-70' : ''}`}>
                  <button onClick={() => setVer(c.id)} className="flex w-full items-start gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold">{c.cliente_nome}</p>
                        <span className={`pilula shrink-0 ${s.cls}`}>{s.t}</span>
                      </div>
                      <p className="num mt-0.5 text-[12.5px] text-suave">{c.cliente_tel || 'sem telefone'} · {c.cotacao_itens.length} itens · {un} un. · {quando(c.criado_em)}</p>
                    </div>
                    <p className="num font-display shrink-0 text-[16px] font-bold text-tinta">{dinheiro(A.valorCotacao(c))}</p>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => whats(c)} className="btn-claro btn-sm flex-1 text-folha"><IconeWhats className="size-4" /> WhatsApp</button>
                    {c.status !== 'pedido' && <button onClick={() => gerar(c)} disabled={gerando} className="btn-folha btn-sm flex-1"><Icone n="check" className="size-4" forte /> Gerar pedido</button>}
                    <button onClick={() => confirm('Excluir esta cotação?') && acao(() => A.excluirCotacao(c.id))} className="btn-claro btn-sm px-3 text-perigo" aria-label="Excluir cotação"><Icone n="lixo" className="size-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Folha
        titulo={c ? `Cotação · ${c.cliente_nome}` : ''}
        aberta={!!c}
        onFechar={() => setVer(null)}
        larga
        rodape={
          c && (
            <div className="flex items-center gap-3">
              <span className="num flex-1 text-[14px]">Total <b className="font-display text-[18px] text-tinta">{dinheiro(A.valorCotacao(c))}</b></span>
              {c.status !== 'pedido' && <button onClick={() => gerar(c)} disabled={gerando} className="btn-folha">Gerar pedido</button>}
            </div>
          )
        }
      >
        {c && (
          <>
            <ul className="divide-y divide-linha rounded-2xl bg-white ring-1 ring-linha">
              {c.cotacao_itens.map((i) => (
                <li key={i.id} className="flex items-center gap-2 px-3 py-2.5 text-[13.5px]">
                  <span className="min-w-0 flex-1"><span className="block font-medium leading-snug">{i.produto_nome}</span><span className="num text-[11.5px] text-suave">{i.fornecedor} · {dinheiro(i.preco)} un.</span></span>
                  <div className="flex shrink-0 items-center rounded-full bg-areia">
                    <button onClick={() => acao(() => A.qtdItemCotacao(i.id, i.qtd - 1))} className="grid size-8 place-items-center" aria-label="Diminuir"><Icone n="menos" className="size-3.5" forte /></button>
                    <span className="num min-w-8 text-center font-semibold">{i.qtd}</span>
                    <button onClick={() => acao(() => A.qtdItemCotacao(i.id, i.qtd + 1))} className="grid size-8 place-items-center" aria-label="Aumentar"><Icone n="mais" className="size-3.5" forte /></button>
                  </div>
                  <b className="num w-20 text-right">{dinheiro(i.qtd * i.preco)}</b>
                </li>
              ))}
            </ul>
            <p className="rotulo mt-4">Adicionar produto</p>
            <BuscaProduto produtos={produtos} fornecedores={fornecedores} onEscolher={(i) => acao(() => A.addItemCotacao(c.id, { produto_nome: i.produto_nome, ref: i.ref, fornecedor: i.fornecedor, qtd: i.qtd, preco: i.preco }))} />
          </>
        )}
      </Folha>
    </>
  );
}
