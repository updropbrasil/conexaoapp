'use client';
import Link from 'next/link';
import { useAdmin } from '@/components/Admin';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { sb } from '@/lib/supabase';
const L = [
  ['/painel/financeiro/', 'carteira', 'Financeiro', 'Parcelas, recebimentos e comissão'],
  ['/painel/categorias/', 'etiqueta', 'Categorias', 'Nome, ícone, cor e pedido mínimo'],
  ['/painel/importar/', 'upload', 'Importar catálogo', 'Lista do Claude a partir do PDF + fotos em lote'],
  ['/painel/aparencia/', 'brilho', 'Aparência', 'Banner e cor do catálogo'],
  ['/', 'casa', 'Ver catálogo público', 'Como o cliente vê'],
];
export default function Mais() {
  const { email } = useAdmin();
  return (
    <>
      <PainelTopo titulo="Mais" sub={email} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="cartao divide-y divide-linha">
          {L.map(([h, n, t, s]) => (
            <Link key={t} href={h} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid size-10 place-items-center rounded-xl bg-marca-claro text-marca"><Icone n={n} /></span>
              <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold">{t}</b><span className="text-[12.5px] text-suave">{s}</span></span>
              <Icone n="dir" className="size-4 text-suave" />
            </Link>
          ))}
          <button onClick={() => sb().auth.signOut()} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-perigo-claro text-perigo"><Icone n="sair" /></span>
            <b className="flex-1 text-[15px] font-semibold text-perigo">Sair</b>
          </button>
        </div>
      </div>
    </>
  );
}
