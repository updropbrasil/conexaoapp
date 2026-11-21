'use client';
import { useEffect } from 'react';
import { Icone } from './Icone';

/** Painel que sobe de baixo no celular e vira janela no desktop. */
export function Folha({ titulo, aberta, onFechar, children, rodape, larga = false }: { titulo: string; aberta: boolean; onFechar: () => void; children: React.ReactNode; rodape?: React.ReactNode; larga?: boolean }) {
  useEffect(() => {
    if (!aberta) return;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', k);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', k);
    };
  }, [aberta, onFechar]);
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onFechar}>
      <div role="dialog" aria-label={titulo} className={`flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-areia shadow-2xl sm:rounded-[24px] ${larga ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 pb-2 pt-4">
          <h2 className="min-w-0 flex-1 truncate text-[18px] font-extrabold text-tinta">{titulo}</h2>
          <button onClick={onFechar} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-linha" aria-label="Fechar"><Icone n="x" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
        {rodape && <div className="pb-seguro border-t border-linha bg-white px-5 pt-3 sm:rounded-b-[24px]">{rodape}</div>}
      </div>
    </div>
  );
}
