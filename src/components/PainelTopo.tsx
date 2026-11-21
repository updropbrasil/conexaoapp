import Link from 'next/link';
import { Icone } from './Icone';

export function PainelTopo({ titulo, sub, voltar, acoes }: { titulo: string; sub?: string; voltar?: string; acoes?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-linha/70 bg-areia/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-3 px-4 py-2">
        {voltar && (
          <Link href={voltar} className="grid size-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-linha" aria-label="Voltar">
            <Icone n="voltar" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-extrabold text-tinta">{titulo}</h1>
          {sub && <p className="truncate text-[12.5px] text-suave">{sub}</p>}
        </div>
        {acoes}
      </div>
    </header>
  );
}

export function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <PainelTopo titulo={titulo} />
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="cartao grid place-items-center gap-2 px-6 py-14 text-center">
          <Icone n="info" className="size-8 text-marca" />
          <p className="font-semibold text-tinta">Entra na Fase 2</p>
          <p className="max-w-sm text-sm text-suave">{texto}</p>
        </div>
      </div>
    </>
  );
}
