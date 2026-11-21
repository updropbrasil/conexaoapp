'use client';
import Link from 'next/link';
import { dinheiro } from '@/lib/formato';
import { Icone } from './Icone';
import { useLoja } from './Loja';

/** Barra flutuante no rodapé (celular e desktop) quando há itens na cotação. */
export function BarraCotacao() {
  const { resumo } = useLoja();
  const n = resumo.grupos.reduce((a, g) => a + g.linhas.length, 0);
  if (!n) return null;
  return (
    <div className="pb-seguro fixed inset-x-0 bottom-0 z-30 px-3 pt-3 sm:px-4">
      <Link href="/cotacao/" className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-tinta p-2.5 pl-4 text-white shadow-[var(--shadow-flutua)]">
        <span className="relative">
          <Icone n="sacola" className="size-6" />
          <span className="num absolute -right-2 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-folha px-1 text-[10.5px] font-bold leading-[18px]">{n}</span>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[12px] text-white/65">Sua cotação · {resumo.unidades} un.</span>
          <span className="num font-display block text-[17px] font-bold">{dinheiro(resumo.total)}</span>
        </span>
        <span className="btn-folha btn-sm py-2.5">
          Ver cotação <Icone n="dir" className="size-4" forte />
        </span>
      </Link>
    </div>
  );
}
