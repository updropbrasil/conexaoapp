'use client';
import { useState } from 'react';
import { Icone, IconeWhats } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { dinheiro, iniciais, normTxt } from '@/lib/formato';
import { clientes, pedidos } from '@/lib/mock/dados';
import { valorPedido } from '@/lib/pedidos';

const CORES = ['bg-marca-claro text-marca', 'bg-folha-claro text-[#2c6a1c]', 'bg-[#fdf0e3] text-[#a3530f]', 'bg-[#f1ecf9] text-[#5b3a9b]', 'bg-[#e6f4f3] text-[#0f6b66]'];

export default function Clientes() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ja' | 'nunca'>('todos');
  const comprado = (nome: string) => pedidos.filter((p) => p.cliente_nome === nome && p.status !== 'cancelado').reduce((a, p) => a + valorPedido(p), 0);
  const lista = clientes.filter((c) => (filtro === 'todos' || (filtro === 'ja') === c.ja_pediu) && (!busca || normTxt(`${c.nome} ${c.responsavel} ${c.cidade}`).includes(normTxt(busca))));
  return (
    <>
      <PainelTopo titulo="Clientes" sub={`${clientes.length} lojas · ${clientes.filter((c) => !c.ja_pediu).length} ainda sem pedido`} acoes={<button className="btn-tinta btn-sm h-10"><Icone n="mais" className="size-4" forte /> Novo</button>} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 ring-1 ring-linha">
          <Icone n="busca" className="size-5 text-suave" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar loja, contato ou cidade" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <div className="mt-3 flex gap-2">
          {([['todos', 'Todos'], ['ja', 'Já pediram'], ['nunca', 'Sem pedido']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${filtro === k ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>{t}</button>
          ))}
        </div>
        <ul className="cartao mt-3 divide-y divide-linha overflow-hidden">
          {lista.map((c, k) => {
            const v = comprado(c.nome);
            return (
              <li key={c.id} className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl font-display text-[14px] font-bold ${CORES[k % CORES.length]}`}>{iniciais(c.nome)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{c.nome}</p>
                  <p className="truncate text-[12.5px] text-suave">{c.responsavel} · {c.cidade}</p>
                  {c.ja_pediu ? (
                    <span className="pilula num mt-1 bg-folha-claro text-[#2c6a1c]">{v ? `Comprou ${dinheiro(v)}` : 'Já pediu'}</span>
                  ) : (
                    <span className="pilula mt-1 bg-alerta-claro text-alerta">Sem pedido ainda</span>
                  )}
                </div>
                <button className="grid size-10 shrink-0 place-items-center rounded-full bg-folha-claro text-folha" aria-label="WhatsApp"><IconeWhats /></button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
