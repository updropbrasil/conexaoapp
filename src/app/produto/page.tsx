'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BarraCotacao } from '@/components/BarraCotacao';
import { CartaoProduto } from '@/components/CartaoProduto';
import { Galeria } from '@/components/Galeria';
import { Icone } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { Quantidade } from '@/components/Quantidade';
import { Aviso, TopoSimples } from '@/components/Topo';
import { corCategoria, dinheiro } from '@/lib/formato';
import { NOVOS } from '@/lib/mock/dados';
import { multiplo } from '@/lib/preco';

export default function PaginaProduto() {
  return (
    <Suspense>
      <Produto />
    </Suspense>
  );
}

function Produto() {
  const id = useSearchParams().get('id');
  const { produtos, fornecedores, adicionar, itens } = useLoja();
  const p = produtos.find((x) => x.id === id);
  const [vid, setVid] = useState<string | null>(null);
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    if (!p) return;
    setVid(p.produto_variacoes[0]?.id ?? null);
    setQtd(multiplo(p));
  }, [p]);

  if (!p)
    return (
      <div className="min-h-dvh">
        <TopoSimples titulo="Produto" />
        <p className="p-8 text-center text-suave">Produto não encontrado.</p>
      </div>
    );

  const f = fornecedores.find((x) => x.id === p.fornecedor_id)!;
  const cor = corCategoria(f.cor);
  const v = p.produto_variacoes.find((x) => x.id === vid) ?? null;
  const preco = v ? v.preco : (p.preco ?? 0);
  const m = multiplo(p);
  const fotos = [...p.produto_fotos].sort((a, b) => a.ordem - b.ordem).map((x) => x.url);
  const faixas = [...p.produto_faixas].sort((a, b) => a.min_valor - b.min_valor);
  const chave = v ? `${p.id}#${v.id}` : p.id;
  const naCotacao = itens.find((i) => i.chave === chave)?.qtd ?? 0;
  const relacionados = produtos.filter((x) => x.fornecedor_id === p.fornecedor_id && x.id !== p.id).slice(0, 4);

  return (
    <div className="min-h-dvh pb-40 lg:pb-16">
      <Aviso />
      <TopoSimples />
      <main className="mx-auto max-w-6xl px-4 pt-4 lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Galeria fotos={fotos} nome={p.nome} />
        </div>

        <section className="pt-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="pilula" style={{ background: cor.fundo, color: cor.texto }}>
              {f.logo} {f.nome}
            </Link>
            {p.categoria && <span className="pilula bg-white text-suave ring-1 ring-linha">{p.categoria}</span>}
            {NOVOS.has(p.id) && <span className="pilula bg-tinta text-white">Novo</span>}
          </div>
          <h1 className="mt-3 text-[24px] font-extrabold leading-tight text-tinta sm:text-[30px]">{p.nome}</h1>
          {(v?.ref || p.ref) && <p className="mt-1.5 text-[13px] text-suave">Ref. {v?.ref || p.ref}</p>}

          <div className="mt-5 flex items-end gap-2">
            <span className="num font-display text-[34px] font-extrabold leading-none text-tinta">{dinheiro(preco)}</span>
            <span className="pb-1 text-sm text-suave">/ unidade</span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-suave">
            <Icone n="caixa" className="size-4" /> Vendido em múltiplos de <b className="num text-texto">{m} un.</b>
          </p>

          {p.produto_variacoes.length > 0 && (
            <div className="mt-6">
              <p className="rotulo">Escolha a opção</p>
              <div className="flex flex-wrap gap-2">
                {p.produto_variacoes.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setVid(x.id)}
                    className={`min-w-14 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition ${x.id === vid ? 'bg-tinta text-white shadow-md' : 'bg-white text-texto ring-1 ring-linha hover:ring-tinta/40'}`}
                  >
                    {x.nome}
                    {x.preco !== p.produto_variacoes[0].preco && <span className={`num ml-1.5 text-[12px] ${x.id === vid ? 'text-white/70' : 'text-suave'}`}>{dinheiro(x.preco)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {faixas.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl bg-folha-claro ring-1 ring-folha/15">
              <div className="flex items-center gap-2 px-4 pt-3.5 text-[14px] font-bold text-[#2c6a1c]">
                <Icone n="baixa" className="size-4" forte /> Preço de atacado: quanto mais, menor
              </div>
              <p className="px-4 pb-2 pt-1 text-[12.5px] leading-snug text-[#2c6a1c]/80">Vale a soma da sua cotação em {f.nome}.</p>
              <table className="num w-full text-[14px]">
                <tbody>
                  <tr className="border-t border-folha/15">
                    <td className="px-4 py-2.5 text-texto/80">Até {dinheiro(faixas[0].min_valor - 0.01)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{dinheiro(p.preco)}</td>
                  </tr>
                  {faixas.map((x) => (
                    <tr key={x.id} className="border-t border-folha/15">
                      <td className="px-4 py-2.5 text-texto/80">A partir de {dinheiro(x.min_valor)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-[#2c6a1c]">{dinheiro(x.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-6 divide-y divide-linha rounded-2xl bg-white text-[14px] ring-1 ring-linha">
            {[
              ['Categoria', `${f.logo} ${f.nome}`],
              ['Linha', p.categoria ?? '—'],
              ['Referência', v?.ref || p.ref || '—'],
              ['Múltiplo mínimo', `${m} unidades`],
              ['Pedido mínimo da categoria', f.pedido_minimo ? dinheiro(f.pedido_minimo) : 'Sem mínimo'],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-suave">{k}</dt>
                <dd className="num text-right font-medium">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Adicionar — fixo no rodapé no celular, inline no desktop */}
          <div className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:static lg:mt-6 lg:rounded-2xl lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="mx-auto flex max-w-xl items-center gap-3 lg:max-w-none">
              <Quantidade valor={qtd} passo={m} onChange={setQtd} grande />
              <button onClick={() => adicionar(chave, qtd)} className="btn-tinta h-12 flex-1 px-4">
                <Icone n="sacola" className="size-5" />
                <span className="num">Adicionar · {dinheiro(preco * qtd)}</span>
              </button>
            </div>
            {naCotacao > 0 && (
              <Link href="/cotacao/" className="mx-auto mt-2 flex max-w-xl items-center justify-center gap-1 text-[12.5px] font-semibold text-folha lg:justify-start">
                <Icone n="check" className="size-4" forte /> <span className="num">{naCotacao} un. já na cotação — ver cotação</span>
              </Link>
            )}
          </div>
        </section>
      </main>

      {relacionados.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          <h2 className="mb-3 text-lg font-bold text-tinta">Mais em {f.nome}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {relacionados.map((x) => (
              <CartaoProduto key={x.id} p={x} categoria={x.categoria ?? undefined} />
            ))}
          </div>
        </section>
      )}
      <div className="hidden lg:block">
        <BarraCotacao />
      </div>
    </div>
  );
}
