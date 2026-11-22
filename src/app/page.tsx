'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CartaoProduto } from '@/components/CartaoProduto';
import { Icone } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { Aviso, BotaoCotacao, Marca } from '@/components/Topo';
import { BarraCotacao } from '@/components/BarraCotacao';
import { corCategoria, miniatura, normTxt } from '@/lib/formato';
import { ehNovo } from '@/lib/catalogo';
import { precoBase } from '@/lib/preco';

const POS = ['left-0 top-6 -rotate-6', 'right-2 top-0 rotate-3', 'left-16 bottom-0 rotate-2', 'right-0 bottom-6 -rotate-3'];
type Ordem = 'relevancia' | 'menor' | 'az';

export default function Catalogo() {
  const { produtos, fornecedores, carregando, erro, aparencia } = useLoja();
  const [cat, setCat] = useState<string>('');
  const [sub, setSub] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('relevancia');

  const contagem = useMemo(() => {
    const m: Record<string, number> = {};
    produtos.forEach((p) => (m[p.fornecedor_id] = (m[p.fornecedor_id] || 0) + 1));
    return m;
  }, [produtos]);
  const categorias = fornecedores.filter((f) => contagem[f.id]);
  const nomeCat = (id: string) => fornecedores.find((f) => f.id === id)?.nome ?? '';
  const subs = useMemo(() => [...new Set(produtos.filter((p) => p.fornecedor_id === cat).map((p) => p.categoria).filter(Boolean) as string[])].sort(), [produtos, cat]);

  const lista = useMemo(() => {
    const t = normTxt(busca);
    let l = produtos.filter(
      (p) => (!cat || p.fornecedor_id === cat) && (!sub || p.categoria === sub) && (!t || normTxt(p.nome).includes(t) || normTxt(p.ref).includes(t) || normTxt(p.categoria).includes(t)),
    );
    if (ordem === 'menor') l = [...l].sort((a, b) => precoBase(a) - precoBase(b));
    if (ordem === 'az') l = [...l].sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordem === 'relevancia') l = [...l].sort((a, b) => Number(ehNovo(b)) - Number(ehNovo(a)));
    return l;
  }, [produtos, cat, sub, busca, ordem]);

  const novidades = produtos.filter(ehNovo).slice(0, 12);
  const vitrine = categorias.map((f) => produtos.find((p) => p.fornecedor_id === f.id && p.img_url)!).filter(Boolean).slice(0, 4);
  const filtrando = !!(cat || busca);

  return (
    <div className="min-h-dvh pb-28">
      <Aviso />
      {/* HERO */}
      <section className="relative overflow-hidden bg-tinta text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-marca/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-folha/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex h-[72px] items-center justify-between">
            <Marca claro />
            <BotaoCotacao claro />
          </div>
          <div className="lg:grid lg:grid-cols-[1fr_440px] lg:items-center lg:gap-10">
          <div className="pb-8 pt-3 sm:pb-12 sm:pt-8">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/85 ring-1 ring-white/15">
              <Icone n="brilho" className="size-3.5" /> Catálogo de atacado
            </p>
            <h1 className="max-w-xl text-[30px] font-extrabold leading-[1.08] sm:text-5xl">
              Direto da indústria <span className="text-[#9fd38a]">para a sua loja.</span>
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-base">Escolha os produtos, monte a cotação e receba os preços no seu WhatsApp.</p>
            <label className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-texto shadow-[var(--shadow-flutua)]">
              <Icone n="busca" className="size-5 text-suave" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto ou referência" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-suave/80" />
              {busca && (
                <button onClick={() => setBusca('')} className="text-suave" aria-label="Limpar busca">
                  <Icone n="x" className="size-4" />
                </button>
              )}
            </label>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-white/70">
              <span className="inline-flex items-center gap-1.5"><Icone n="check" className="size-4 text-[#9fd38a]" forte /> Cotação sem cadastro</span>
              <span className="inline-flex items-center gap-1.5"><Icone n="check" className="size-4 text-[#9fd38a]" forte /> Preço cai no volume</span>
              <span className="inline-flex items-center gap-1.5"><Icone n="check" className="size-4 text-[#9fd38a]" forte /> Resposta pelo WhatsApp</span>
            </div>
          </div>
          <div className="relative hidden h-[360px] lg:block" aria-hidden>
            {vitrine.map((p, k) => (
              <div key={p.id} className={`absolute size-48 overflow-hidden rounded-3xl bg-white p-1.5 shadow-2xl ring-1 ring-white/20 ${POS[k]}`}>
                <img src={miniatura(p.img_url)!} alt="" className="size-full rounded-[20px] object-cover" />
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="sticky top-0 z-20 border-b border-linha/70 bg-areia/95 backdrop-blur-md">
        <div className="sem-barra mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          <BotaoCat ativo={!cat} onClick={() => { setCat(''); setSub(''); }} emoji="✨" nome="Tudo" n={produtos.length} cor={{ fundo: '#fff', texto: '#0c1f4f' }} />
          {categorias.map((f) => (
            <BotaoCat key={f.id} ativo={cat === f.id} onClick={() => { setCat(f.id); setSub(''); }} emoji={f.logo ?? '🏭'} nome={f.nome} n={contagem[f.id]} cor={corCategoria(f.cor)} />
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        {aparencia.banner_url && !filtrando && (
          <img src={aparencia.banner_url} alt="" className="mt-5 aspect-[3/1] w-full rounded-[var(--radius-card)] object-cover shadow-[var(--shadow-card)] sm:aspect-[4/1]" />
        )}
        {!filtrando && novidades.length > 0 && (
          <section className="pt-6">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-bold text-tinta">Chegou agora</h2>
              <span className="text-[13px] text-suave">{novidades.length} novidades</span>
            </div>
            <div className="sem-barra -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {novidades.map((p) => (
                <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-56">
                  <CartaoProduto p={p} novo categoria={nomeCat(p.fornecedor_id)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-tinta">{busca ? `Resultados para “${busca}”` : cat ? nomeCat(cat) : 'Todos os produtos'}</h2>
              <span className="num text-[13px] text-suave">{lista.length} {lista.length === 1 ? 'produto' : 'produtos'}</span>
            </div>
            <label className="relative shrink-0">
              <span className="sr-only">Ordenar</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="appearance-none rounded-full bg-white py-2 pl-3.5 pr-8 text-[13px] font-semibold text-tinta ring-1 ring-linha outline-none">
                <option value="relevancia">Destaques</option>
                <option value="menor">Menor preço</option>
                <option value="az">A–Z</option>
              </select>
              <Icone n="dir" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-suave" />
            </label>
          </div>
          {cat && subs.length > 1 && (
            <div className="sem-barra -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
              {['', ...subs].map((s) => (
                <button key={s || 'todas'} onClick={() => setSub(s)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${sub === s ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>
                  {s || 'Todas'}
                </button>
              ))}
            </div>
          )}
          {carregando && !produtos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 8 }, (_, k) => (
                <div key={k} className="cartao overflow-hidden">
                  <div className="aspect-square animate-pulse bg-areia-2" />
                  <div className="space-y-2 p-3"><div className="h-3 w-3/4 animate-pulse rounded bg-areia-2" /><div className="h-4 w-1/2 animate-pulse rounded bg-areia-2" /></div>
                </div>
              ))}
            </div>
          ) : lista.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {lista.map((p) => (
                <CartaoProduto key={p.id} p={p} novo={ehNovo(p)} categoria={cat ? (p.categoria ?? undefined) : nomeCat(p.fornecedor_id)} />
              ))}
            </div>
          ) : (
            <div className="cartao grid place-items-center gap-2 px-6 py-14 text-center">
              <Icone n="busca" className="size-8 text-suave/60" />
              <p className="font-semibold">{erro ? 'Não foi possível carregar o catálogo' : produtos.length ? 'Nada encontrado' : 'Catálogo em atualização'}</p>
              <p className="text-sm text-suave">{erro ? erro : produtos.length ? 'Tente outro nome ou a referência do produto.' : 'Estamos cadastrando os produtos. Volte em breve!'}</p>
            </div>
          )}
        </section>

        <section className="mt-10 overflow-hidden rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] sm:flex sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="text-lg font-bold text-tinta">Tem loja? Cadastre-se</h2>
            <p className="mt-1 text-sm text-suave">Com o cadastro, o representante já recebe seus dados para faturar o pedido.</p>
          </div>
          <Link href="/cadastro/" className="btn-tinta mt-4 w-full sm:mt-0 sm:w-auto">Cadastrar minha loja</Link>
        </section>
        <footer className="mt-8 border-t border-linha pb-8 pt-6 text-[12px] text-suave">
          <img src="/marca/logo-completa.webp" alt="Conexão Indústria & Varejo — Direto da fábrica para a sua loja. Enviamos para todo o Brasil!" width={300} height={100} loading="lazy" className="mx-auto h-auto w-full max-w-[280px] sm:mx-0" />
          <div className="mt-5 flex items-center justify-between">
            <span>© Conexão Indústria &amp; Varejo</span>
            <Link href="/painel/pedidos/" className="font-semibold text-suave/80 hover:text-tinta">Área do representante</Link>
          </div>
        </footer>
      </main>
      <BarraCotacao />
    </div>
  );
}

function BotaoCat({ ativo, onClick, emoji, nome, n, cor }: { ativo: boolean; onClick: () => void; emoji: string; nome: string; n: number; cor: { fundo: string; texto: string } }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-3.5 text-left transition ${ativo ? 'bg-tinta text-white shadow-md' : 'bg-white text-texto ring-1 ring-linha hover:ring-marca/40'}`}
    >
      <span className="grid size-9 place-items-center rounded-xl text-lg" style={{ background: ativo ? 'rgba(255,255,255,.12)' : cor.fundo }}>
        {emoji}
      </span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[13px] font-semibold">{nome}</span>
        <span className={`num block text-[11px] ${ativo ? 'text-white/65' : 'text-suave'}`}>{n} itens</span>
      </span>
    </button>
  );
}
