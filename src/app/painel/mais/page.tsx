import Link from 'next/link';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
const L = [
  ['/painel/importar/', 'upload', 'Importar catálogo', 'Cole a lista gerada pelo Claude a partir do PDF'],
  ['/painel/categorias/', 'etiqueta', 'Categorias', 'Nome, emoji, cor e pedido mínimo'],
  ['/painel/financeiro/', 'carteira', 'Financeiro', 'Parcelas, recebimentos e comissão'],
  ['#', 'sino', 'Avisos neste aparelho', 'Notificação quando chegar cotação'],
  ['/', 'sair', 'Ver catálogo público', 'Como o cliente vê'],
];
export default function Mais() {
  return (
    <>
      <PainelTopo titulo="Mais" />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="cartao divide-y divide-linha">
          {L.map(([h, n, t, s]) => (
            <Link key={t} href={h} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid size-10 place-items-center rounded-xl bg-marca-claro text-marca"><Icone n={n} /></span>
              <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold">{t}</b><span className="text-[12.5px] text-suave">{s}</span></span>
              <Icone n="dir" className="size-4 text-suave" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
