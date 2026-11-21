'use client';
import Link from 'next/link';
import { dinheiro } from '@/lib/formato';
import { Mini } from './Foto';
import { menorPreco, multiplo, precoBase, temVariacao } from '@/lib/preco';
import type { Produto } from '@/lib/types';
import { Icone } from './Icone';

export function FotoVazia({ className = '' }: { className?: string }) {
  return (
    <div className={`grid place-items-center bg-areia-2 text-suave/50 ${className}`}>
      <Icone n="foto" className="size-10" />
    </div>
  );
}

export function CartaoProduto({ p, novo = false, categoria }: { p: Produto; novo?: boolean; categoria?: string }) {
  const temFaixa = p.produto_faixas.length > 0;
  const nFotos = p.produto_fotos.length;
  return (
    <Link href={`/produto/?id=${p.id}`} className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-areia-2">
        {p.img_url ? (
          <Mini url={p.img_url} alt={p.nome} className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <FotoVazia className="size-full" />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {novo && <span className="pilula bg-tinta text-white">Novo</span>}
          {temFaixa && (
            <span className="pilula bg-folha text-white">
              <Icone n="baixa" className="size-3" forte /> Atacado
            </span>
          )}
        </div>
        {nFotos > 1 && <span className="pilula num absolute bottom-2 right-2 bg-black/45 text-white backdrop-blur"><Icone n="foto" className="size-3" /> {nFotos}</span>}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {categoria && <span className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wide text-marca">{categoria}</span>}
        <h3 className="line-clamp-2 min-h-[2.5em] font-sans text-[13.5px] font-medium leading-[1.25] tracking-normal text-texto sm:text-[14.5px]">{p.nome}</h3>
        <div className="mt-auto pt-2.5">
          <span className={`block text-[11px] leading-none text-suave ${temVariacao(p) || temFaixa ? '' : 'invisible'}`}>a partir de</span>
          <div className="flex items-end justify-between gap-2">
            <span className="num font-display text-[17px] font-extrabold leading-tight text-tinta sm:text-lg">{dinheiro(temFaixa ? menorPreco(p) : precoBase(p))}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tinta text-white transition group-hover:bg-folha" aria-hidden>
              <Icone n="mais" className="size-4" forte />
            </span>
          </div>
          <span className="num mt-1 block text-[11.5px] text-suave">
            {temVariacao(p) ? `${p.produto_variacoes.length} opções · ` : ''}mín. {multiplo(p)} un.
          </span>
        </div>
      </div>
    </Link>
  );
}
