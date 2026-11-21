'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Emblema, Icone } from '@/components/Icone';

const NAV = [
  { href: '/painel/pedidos/', n: 'caixa', t: 'Pedidos' },
  { href: '/painel/cotacoes/', n: 'doc', t: 'Cotações' },
  { href: '/painel/produtos/', n: 'grade', t: 'Produtos' },
  { href: '/painel/clientes/', n: 'pessoas', t: 'Clientes' },
];
const EXTRA = [
  { href: '/painel/importar/', n: 'upload', t: 'Importar catálogo' },
  { href: '/painel/categorias/', n: 'etiqueta', t: 'Categorias' },
  { href: '/painel/financeiro/', n: 'carteira', t: 'Financeiro' },
];

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ativo = (h: string) => path.startsWith(h) || (h === '/painel/produtos/' && path.startsWith('/painel/importar'));
  return (
    <div className="min-h-dvh lg:pl-64">
      {/* lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-tinta px-4 py-5 text-white lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-white"><Emblema className="size-8" /></span>
          <span className="leading-none">
            <b className="font-display block text-[16px] font-extrabold">CONEXÃO</b>
            <span className="text-[11px] text-white/60">Painel do representante</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {[...NAV, ...EXTRA].map((i) => (
            <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${path.startsWith(i.href) ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/6 hover:text-white'}`}>
              <Icone n={i.n} className="size-5" /> {i.t}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/65 hover:bg-white/6"><Icone n="sino" /> Avisos neste aparelho</button>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/65 hover:bg-white/6"><Icone n="sair" /> Ver catálogo</Link>
        </div>
      </aside>

      <div className="pb-24 lg:pb-10">{children}</div>

      {/* barra inferior (celular) */}
      <nav className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1.5">
          {[...NAV, { href: '/painel/mais/', n: 'pontos', t: 'Mais' }].map((i) => {
            const on = ativo(i.href) || (i.href === '/painel/mais/' && EXTRA.some((e) => path.startsWith(e.href) && e.href !== '/painel/importar/'));
            return (
              <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold ${on ? 'text-tinta' : 'text-suave'}`}>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${on ? 'bg-marca-claro' : ''}`}>
                  <Icone n={i.n} className="size-[22px]" forte={on} />
                </span>
                {i.t}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
