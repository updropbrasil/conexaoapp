'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { Folha } from '@/components/Folha';
import { FormCliente } from '@/components/FormCliente';
import { Icone, IconeWhats } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { excluirCliente, listarClientes, listarPedidos, salvarCliente, valorPedido } from '@/lib/admin';
import { dinheiro, iniciais, normTxt } from '@/lib/formato';
import type { Cliente } from '@/lib/types';
import { soDigitos } from '@/lib/validacao';

const CORES = ['bg-marca-claro text-marca', 'bg-folha-claro text-[#2c6a1c]', 'bg-[#fdf0e3] text-[#a3530f]', 'bg-[#f1ecf9] text-[#5b3a9b]', 'bg-[#e6f4f3] text-[#0f6b66]'];

export default function Clientes() {
  const { avisar, falhar } = useAdmin();
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [comprado, setComprado] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ja' | 'nunca'>('todos');
  const [edit, setEdit] = useState<Cliente | null | 'novo'>(null);

  const carregar = useCallback(async () => {
    try {
      const [cs, ps] = await Promise.all([listarClientes(), listarPedidos()]);
      setClientes(cs);
      const m: Record<string, number> = {};
      ps.filter((p) => p.status !== 'cancelado').forEach((p) => (m[p.cliente_nome.toLowerCase()] = (m[p.cliente_nome.toLowerCase()] || 0) + valorPedido(p)));
      setComprado(m);
    } catch (e) {
      falhar(e);
    }
  }, [falhar]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = (clientes ?? []).filter((c) => (filtro === 'todos' || (filtro === 'ja') === !!c.ja_pediu) && (!busca || normTxt(`${c.nome} ${c.responsavel} ${c.cidade} ${c.doc}`).includes(normTxt(busca))));
  const atual = edit && edit !== 'novo' ? edit : null;
  return (
    <>
      <PainelTopo titulo="Clientes" sub={clientes ? `${clientes.length} lojas · ${clientes.filter((c) => !c.ja_pediu).length} ainda sem pedido` : ''} acoes={<button onClick={() => setEdit('novo')} className="btn-tinta btn-sm h-10"><Icone n="mais" className="size-4" forte /> Novo</button>} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 ring-1 ring-linha">
          <Icone n="busca" className="size-5 text-suave" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar loja, contato, cidade ou CNPJ" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <div className="mt-3 flex gap-2">
          {([['todos', 'Todos'], ['ja', 'Já pediram'], ['nunca', 'Sem pedido']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${filtro === k ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>{t}</button>
          ))}
        </div>
        {clientes === null ? (
          <p className="py-10 text-center text-suave">Carregando…</p>
        ) : !lista.length ? (
          <div className="cartao mt-3 px-6 py-12 text-center text-suave">Nenhum cliente encontrado.</div>
        ) : (
          <ul className="cartao mt-3 divide-y divide-linha overflow-hidden">
            {lista.map((c, k) => {
              const v = comprado[c.nome.toLowerCase()] ?? 0;
              const tel = soDigitos(c.tel);
              return (
                <li key={c.id} className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
                  <button onClick={() => setEdit(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl font-display text-[14px] font-bold ${CORES[k % CORES.length]}`}>{iniciais(c.nome) || '?'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{c.nome}</span>
                      <span className="block truncate text-[12.5px] text-suave">{[c.responsavel, c.cidade].filter(Boolean).join(' · ') || c.doc || '—'}</span>
                      {c.ja_pediu ? <span className="pilula num mt-1 bg-folha-claro text-[#2c6a1c]">{v ? `Comprou ${dinheiro(v)}` : 'Já pediu'}</span> : <span className="pilula mt-1 bg-alerta-claro text-alerta">Sem pedido ainda</span>}
                    </span>
                  </button>
                  {tel && (
                    <a href={`https://wa.me/${tel.length <= 11 ? '55' + tel : tel}`} target="_blank" rel="noopener" className="grid size-10 shrink-0 place-items-center rounded-full bg-folha-claro text-folha" aria-label="WhatsApp"><IconeWhats /></a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Folha titulo={atual ? 'Editar cliente' : 'Novo cliente'} aberta={edit !== null} onFechar={() => setEdit(null)}>
        {edit !== null && (
          <FormCliente
            key={atual?.id ?? 'novo'}
            inicial={atual}
            botao="Salvar"
            rodape={atual ? <button onClick={() => confirm(`Excluir ${atual.nome}?`) && excluirCliente(atual.id).then(() => (setEdit(null), avisar('Cliente excluído'), carregar())).catch(falhar)} className="btn-claro px-4 text-perigo" aria-label="Excluir cliente"><Icone n="lixo" /></button> : undefined}
            onSalvar={async (d) => {
              await salvarCliente(atual?.id ?? null, d);
              setEdit(null);
              avisar('Cliente salvo');
              carregar();
            }}
          />
        )}
      </Folha>
    </>
  );
}
