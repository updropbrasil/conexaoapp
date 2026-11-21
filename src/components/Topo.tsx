'use client';
import Link from 'next/link';
import { Emblema, Icone } from './Icone';
import { useLoja } from './Loja';

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <Emblema className="size-8" />
      </span>
      <span className="leading-none">
        <b className={`font-display block text-[17px] font-extrabold tracking-tight ${claro ? 'text-white' : 'text-tinta'}`}>CONEXÃO</b>
        <span className={`text-[11px] font-medium ${claro ? 'text-white/70' : 'text-suave'}`}>Indústria &amp; Varejo</span>
      </span>
    </Link>
  );
}

export function BotaoCotacao({ claro = false }: { claro?: boolean }) {
  const { resumo } = useLoja();
  const n = resumo.grupos.reduce((a, g) => a + g.linhas.length, 0);
  return (
    <Link
      href="/cotacao/"
      className={`relative inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold transition ${claro ? 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15' : 'bg-white text-tinta ring-1 ring-linha'}`}
      aria-label="Ver cotação"
    >
      <Icone n="sacola" className="size-5" />
      <span className="hidden sm:inline">Cotação</span>
      {n > 0 && <span className="num absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-folha px-1.5 text-[11px] font-bold leading-5 text-white ring-2 ring-tinta">{n}</span>}
    </Link>
  );
}

/** Cabeçalho das páginas internas do catálogo (produto, cotação). */
export function TopoSimples({ titulo, voltar = '/' }: { titulo?: string; voltar?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-linha/70 bg-areia/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href={voltar} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-linha" aria-label="Voltar">
          <Icone n="voltar" />
        </Link>
        <div className="min-w-0 flex-1">
          {titulo ? <h1 className="truncate text-[17px] font-bold text-tinta">{titulo}</h1> : <div className="hidden sm:block"><Marca /></div>}
        </div>
        <BotaoCotacao />
      </div>
    </header>
  );
}

export function Aviso() {
  const { aviso } = useLoja();
  if (!aviso) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-flutua)]">
        <span className="grid size-5 place-items-center rounded-full bg-folha"><Icone n="check" className="size-3.5" forte /></span>
        {aviso}
      </div>
    </div>
  );
}
