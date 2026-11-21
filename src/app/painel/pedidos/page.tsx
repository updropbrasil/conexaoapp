'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { dataCurta, dinheiro } from '@/lib/formato';
import { pedidos } from '@/lib/mock/dados';
import { comissaoPedido, unidadesPedido, valorPedido } from '@/lib/pedidos';
import { STATUS } from '@/lib/status';
import type { StatusPedido } from '@/lib/types';

export default function Pedidos() {
  const [filtro, setFiltro] = useState<StatusPedido | ''>('');
  const validos = pedidos.filter((p) => p.status !== 'cancelado');
  const fat = validos.reduce((a, p) => a + valorPedido(p), 0);
  const com = validos.reduce((a, p) => a + comissaoPedido(p), 0);
  const abertos = pedidos.filter((p) => ['aberto', 'separacao'].includes(p.status)).length;
  const lista = pedidos.filter((p) => !filtro || p.status === filtro);

  return (
    <>
      <PainelTopo
        titulo="Pedidos"
        acoes={
          <button className="btn-tinta btn-sm h-10">
            <Icone n="mais" className="size-4" forte /> Novo
          </button>
        }
      />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white p-1.5 ring-1 ring-linha">
          <button className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia" aria-label="Mês anterior"><Icone n="esq" /></button>
          <b className="text-[15px] font-semibold text-tinta">Novembro de 2026</b>
          <button className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia" aria-label="Próximo mês"><Icone n="dir" /></button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2 rounded-[var(--radius-card)] bg-tinta p-4 text-white lg:col-span-2">
            <p className="text-[12.5px] text-white/65">Faturamento do mês</p>
            <p className="num font-display mt-0.5 text-[28px] font-extrabold leading-tight">{dinheiro(fat)}</p>
            <p className="num mt-1 text-[12.5px] text-[#9fd38a]">Sua comissão: {dinheiro(com)}</p>
          </div>
          <div className="cartao p-4">
            <p className="text-[12.5px] text-suave">Pedidos</p>
            <p className="num font-display text-[26px] font-extrabold text-tinta">{pedidos.length}</p>
          </div>
          <div className="cartao p-4">
            <p className="text-[12.5px] text-suave">Em andamento</p>
            <p className="num font-display text-[26px] font-extrabold text-alerta">{abertos}</p>
          </div>
        </div>

        <div className="sem-barra -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {(['', 'aberto', 'separacao', 'faturado', 'enviado', 'entregue', 'cancelado'] as const).map((s) => (
            <button key={s || 'todos'} onClick={() => setFiltro(s)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${filtro === s ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>
              {s ? STATUS[s].t : 'Todos'}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-2.5">
          {lista.map((p) => {
            const s = STATUS[p.status];
            return (
              <li key={p.id}>
                <Link href={`/painel/pedidos/ver/?id=${p.id}`} className="cartao flex items-center gap-3 p-3.5 transition hover:shadow-md sm:p-4">
                  <span className="num grid size-12 shrink-0 place-items-center rounded-2xl bg-areia text-[13px] font-bold text-tinta">{p.numero?.replace('#', '')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{p.cliente_nome}</p>
                    <p className="num truncate text-[12.5px] text-suave">
                      {p.fornecedor} · {unidadesPedido(p)} un. · {dataCurta(p.criado_em)}
                    </p>
                    <span className={`pilula mt-1.5 ${s.cls}`}>
                      <span className="size-1.5 rounded-full" style={{ background: s.ponto }} /> {s.t}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`num font-display text-[16px] font-bold ${p.status === 'cancelado' ? 'text-suave line-through' : 'text-tinta'}`}>{dinheiro(valorPedido(p))}</p>
                    <Icone n="dir" className="ml-auto mt-1 size-4 text-suave" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
