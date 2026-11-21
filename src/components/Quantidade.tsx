'use client';
import { Icone } from './Icone';

export function Quantidade({ valor, passo, min = passo, onChange, grande = false }: { valor: number; passo: number; min?: number; onChange: (n: number) => void; grande?: boolean }) {
  const h = grande ? 'h-12' : 'h-9';
  const w = grande ? 'w-12' : 'w-9';
  return (
    <div className={`inline-flex items-center rounded-full bg-white ring-1 ring-linha ${h}`}>
      <button type="button" onClick={() => onChange(Math.max(min - passo, valor - passo))} className={`grid ${w} ${h} place-items-center rounded-full text-tinta disabled:opacity-30`} disabled={valor <= min && min > 0} aria-label="Diminuir">
        <Icone n="menos" className="size-4" forte />
      </button>
      <span className={`num min-w-10 text-center font-bold text-tinta ${grande ? 'text-lg' : 'text-[14px]'}`}>{valor}</span>
      <button type="button" onClick={() => onChange(valor + passo)} className={`grid ${w} ${h} place-items-center rounded-full text-tinta`} aria-label="Aumentar">
        <Icone n="mais" className="size-4" forte />
      </button>
    </div>
  );
}
