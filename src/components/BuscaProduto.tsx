'use client';
import { useMemo, useState } from 'react';
import type { ItemNovo } from '@/lib/admin';
import { dinheiro, normTxt } from '@/lib/formato';
import { multiplo } from '@/lib/preco';
import type { Fornecedor, Produto } from '@/lib/types';
import { Icone } from './Icone';
import { Quantidade } from './Quantidade';

/** Busca produto/variação por nome ou referência e devolve o item pronto para cotação/pedido. */
export function BuscaProduto({ produtos, fornecedores, onEscolher }: { produtos: Produto[]; fornecedores: Fornecedor[]; onEscolher: (i: ItemNovo) => void }) {
  const [t, setT] = useState('');
  const [forn, setForn] = useState('');
  const [qtd, setQtd] = useState(1);
  const opcoes = useMemo(() => {
    const out: { chave: string; nome: string; ref: string | null; preco: number; p: Produto }[] = [];
    produtos.forEach((p) => {
      if (forn && p.fornecedor_id !== forn) return;
      if (p.produto_variacoes.length) p.produto_variacoes.forEach((v) => out.push({ chave: p.id + v.id, nome: `${p.nome} (${v.nome})`, ref: v.ref, preco: v.preco, p }));
      else out.push({ chave: p.id, nome: p.nome, ref: p.ref, preco: p.preco ?? 0, p });
    });
    const q = normTxt(t);
    return (q ? out.filter((o) => normTxt(o.nome + ' ' + (o.ref ?? '')).includes(q)) : out).slice(0, 12);
  }, [produtos, forn, t]);
  return (
    <div className="space-y-2">
      <select className="campo py-2.5" value={forn} onChange={(e) => setForn(e.target.value)}>
        <option value="">Todas as categorias</option>
        {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.logo} {f.nome}</option>)}
      </select>
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-linha">
          <Icone n="busca" className="size-4 text-suave" />
          <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Nome ou referência" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none" />
        </label>
        <Quantidade valor={qtd} passo={1} min={1} onChange={setQtd} />
      </div>
      <ul className="max-h-56 space-y-1.5 overflow-y-auto">
        {opcoes.map((o) => (
          <li key={o.chave}>
            <button
              onClick={() => onEscolher({ produto_nome: o.nome, ref: o.ref, fornecedor: fornecedores.find((f) => f.id === o.p.fornecedor_id)?.nome ?? '', qtd: Math.max(qtd, 1), preco: o.preco, custo: o.p.custo })}
              className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-linha hover:ring-marca/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">{o.nome}</span>
                <span className="num text-[11.5px] text-suave">{o.ref || 'sem ref.'} · mín. {multiplo(o.p)}</span>
              </span>
              <b className="num shrink-0 text-[13.5px]">{dinheiro(o.preco)}</b>
              <Icone n="mais" className="size-4 shrink-0 text-marca" forte />
            </button>
          </li>
        ))}
        {!opcoes.length && <li className="px-1 py-2 text-[13px] text-suave">Nada encontrado.</li>}
      </ul>
    </div>
  );
}
