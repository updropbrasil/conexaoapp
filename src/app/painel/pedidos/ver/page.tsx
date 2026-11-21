'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Icone, IconeWhats } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { dinheiro, iniciais } from '@/lib/formato';
import { clientes, pedidos } from '@/lib/mock/dados';
import { comissaoPedido, valorPedido } from '@/lib/pedidos';
import { FLUXO, STATUS } from '@/lib/status';
import type { StatusPedido } from '@/lib/types';

export default function Pagina() {
  return (
    <Suspense>
      <Ver />
    </Suspense>
  );
}

const CURTO: Record<string, string> = { aberto: 'Aberto', separacao: 'Separação', faturado: 'Faturado', enviado: 'Enviado', entregue: 'Entregue' };
const dataBr = (s: string | null) => (s ? s.split('-').reverse().join('/') : 'sem data');

function Ver() {
  const id = useSearchParams().get('id');
  const p = pedidos.find((x) => x.id === id) ?? pedidos[0];
  const [status, setStatus] = useState<StatusPedido>(p.status);
  const c = clientes.find((x) => x.nome === p.cliente_nome);
  const tot = valorPedido(p);
  const com = comissaoPedido(p);
  const passo = FLUXO.indexOf(status);

  return (
    <>
      <PainelTopo titulo={`Pedido ${p.numero}`} sub={`${new Date(p.criado_em).toLocaleDateString('pt-BR')} · ${p.fornecedor}`} voltar="/painel/pedidos/" />
      <div className="mx-auto max-w-5xl px-4 pb-32 pt-4 lg:grid lg:grid-cols-[1fr_340px] lg:gap-5">
        <div className="space-y-4">
          <section className="cartao p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-tinta">Andamento</h2>
              <select value={status} onChange={(e) => setStatus(e.target.value as StatusPedido)} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none ${STATUS[status].cls}`}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.t}</option>
                ))}
              </select>
            </div>
            {status === 'cancelado' ? (
              <p className="mt-3 rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">Pedido cancelado — não entra no faturamento.</p>
            ) : (
              <ol className="mt-4 grid grid-cols-5">
                {FLUXO.map((s, k) => (
                  <li key={s} className="relative flex flex-col items-center text-center">
                    {k > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${k <= passo ? 'bg-folha' : 'bg-linha'}`} />}
                    <span className={`relative grid size-6 place-items-center rounded-full ring-4 ring-white ${k <= passo ? 'bg-folha text-white' : 'bg-areia-2 text-suave'}`}>
                      {k <= passo ? <Icone n="check" className="size-3.5" forte /> : <span className="size-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={`mt-1.5 text-[10.5px] font-semibold leading-tight sm:text-[12px] ${k === passo ? 'text-tinta' : 'text-suave'}`}>{CURTO[s]}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="cartao overflow-hidden">
            <header className="flex items-center justify-between border-b border-linha px-4 py-3">
              <h2 className="text-[15px] font-bold text-tinta">Itens</h2>
              <button className="btn-claro btn-sm"><Icone n="mais" className="size-4" forte /> Adicionar</button>
            </header>
            <ul className="divide-y divide-linha">
              {p.pedido_itens.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium leading-snug">{i.produto_nome}</p>
                    <p className="num mt-0.5 text-[12px] text-suave">{i.ref ? `${i.ref} · ` : ''}{dinheiro(i.preco)} / un.</p>
                  </div>
                  <span className="num shrink-0 rounded-lg bg-areia px-2 py-1 text-[13px] font-semibold">{i.qtd}×</span>
                  <span className="num w-24 shrink-0 text-right text-[14px] font-bold">{dinheiro(i.qtd * i.preco)}</span>
                </li>
              ))}
            </ul>
            <dl className="num space-y-1.5 border-t border-linha bg-areia/50 px-4 py-3 text-[14px]">
              <div className="flex justify-between"><dt className="font-semibold">Total</dt><dd className="font-display text-[18px] font-extrabold text-tinta">{dinheiro(tot)}</dd></div>
              <div className="flex justify-between text-[#2c6a1c]"><dt>Sua comissão</dt><dd className="font-semibold">{dinheiro(com)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          <section className="cartao p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-marca-claro font-display text-[15px] font-bold text-marca">{iniciais(p.cliente_nome)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{p.cliente_nome}</p>
                <p className="truncate text-[12.5px] text-suave">{c?.responsavel} · {c?.cidade}</p>
              </div>
              <button className="grid size-10 place-items-center rounded-full bg-folha-claro text-folha" aria-label="WhatsApp do cliente"><IconeWhats /></button>
            </div>
            <div className="mt-4">
              <span className="rotulo">Transportadora</span>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-linha">
                <Icone n="caminhao" className="size-5 text-suave" />
                <input defaultValue={p.transportadora ?? ''} placeholder="Ex.: Braspress" className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none" />
              </div>
            </div>
          </section>

          <section className="cartao p-4">
            <h2 className="text-[15px] font-bold text-tinta">Parcelas</h2>
            {p.parcelas.length ? (
              <ul className="mt-2 divide-y divide-linha">
                {p.parcelas.map((pc) => (
                  <li key={pc.id} className="num flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">{pc.numero}/{pc.total} · {dataBr(pc.vencimento)}</p>
                      <p className="text-[12px] text-[#2c6a1c]">comissão {dinheiro(pc.comissao)}</p>
                    </div>
                    <b className="text-[14px]">{dinheiro(pc.valor)}</b>
                    {pc.recebido ? (
                      <span className="pilula bg-folha-claro text-[#2c6a1c]"><Icone n="check" className="size-3" forte /> Pago</span>
                    ) : (
                      <button className="btn-folha btn-sm px-3 py-1.5">Receber</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <label><span className="rotulo">Parcelas</span><input className="campo num px-3" defaultValue="3" /></label>
                <label><span className="rotulo">1º venc.</span><input className="campo num px-3" defaultValue="21/12" /></label>
                <label><span className="rotulo">A cada</span><input className="campo num px-3" defaultValue="30 dias" /></label>
                <button className="btn-claro btn-sm col-span-3 mt-1">Gerar parcelas</button>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="pb-seguro fixed inset-x-0 bottom-16 z-40 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-5xl gap-2">
          <button className="btn-claro px-4 text-perigo" aria-label="Excluir pedido"><Icone n="lixo" /></button>
          <button className="btn-claro flex-1"><Icone n="doc" /> PDF</button>
          <button className="btn-folha flex-1"><IconeWhats /> Enviar</button>
        </div>
      </div>
    </>
  );
}
