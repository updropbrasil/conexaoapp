'use client';
import { useEffect, useState } from 'react';
import { Icone } from './Icone';

/** Arredonda para cima até o múltiplo de venda (ex.: caixa com 12). */
const noPasso = (n: number, passo: number) => (passo > 1 ? Math.ceil(n / passo) * passo : n);

/**
 * Campo de quantidade digitável. Deixa apagar e digitar à vontade (ex.: apagar o "1" e digitar "40");
 * só corrige o valor (mínimo/múltiplo) quando a pessoa sai do campo ou aperta Enter.
 * Com passo 1 o total já acompanha a digitação.
 */
export function CampoQtd({ valor, passo = 1, min = 1, onChange, className = '', rotulo = 'Quantidade' }: { valor: number; passo?: number; min?: number; onChange: (n: number) => void; className?: string; rotulo?: string }) {
  const [txt, setTxt] = useState(String(valor));
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    if (!editando) setTxt(String(valor));
  }, [valor, editando]);
  const confirmar = () => {
    setEditando(false);
    const n = parseInt(txt, 10);
    if (!txt || isNaN(n)) return setTxt(String(valor));
    const final = Math.max(min, noPasso(n, passo));
    setTxt(String(final));
    if (final !== valor) onChange(final);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      aria-label={rotulo}
      className={className}
      value={txt}
      onFocus={(e) => {
        setEditando(true);
        e.currentTarget.select();
      }}
      onChange={(e) => {
        const limpo = e.target.value.replace(/\D/g, '').slice(0, 6);
        setTxt(limpo);
        const n = parseInt(limpo, 10);
        if (passo <= 1 && n >= Math.max(min, 1)) onChange(n);
      }}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

export function Quantidade({ valor, passo, min = passo, onChange, grande = false }: { valor: number; passo: number; min?: number; onChange: (n: number) => void; grande?: boolean }) {
  const h = grande ? 'h-12' : 'h-9';
  const w = grande ? 'w-12' : 'w-9';
  return (
    <div className={`inline-flex items-center rounded-full bg-white ring-1 ring-linha ${h}`}>
      <button type="button" onClick={() => onChange(Math.max(min - passo, valor - passo))} className={`grid ${w} ${h} place-items-center rounded-full text-tinta disabled:opacity-30`} disabled={valor <= min && min > 0} aria-label="Diminuir">
        <Icone n="menos" className="size-4" forte />
      </button>
      <CampoQtd
        valor={valor}
        passo={passo}
        min={min}
        onChange={onChange}
        className={`num ${grande ? 'w-12 text-lg' : 'w-11 text-[14px]'} h-full min-w-0 bg-transparent text-center font-bold text-tinta outline-none focus:rounded-md focus:bg-areia`}
      />
      <button type="button" onClick={() => onChange(valor + passo)} className={`grid ${w} ${h} place-items-center rounded-full text-tinta`} aria-label="Aumentar">
        <Icone n="mais" className="size-4" forte />
      </button>
    </div>
  );
}
