'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FotoVazia } from '@/components/CartaoProduto';
import { Icone, IconeWhats } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { Quantidade } from '@/components/Quantidade';
import { TopoSimples } from '@/components/Topo';
import { corCategoria, dinheiro, miniatura } from '@/lib/formato';
import { multiplo } from '@/lib/preco';

const soDigitos = (s: string) => s.replace(/\D/g, '');
const mascaraTel = (s: string) => {
  const n = soDigitos(s).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
};

export default function Cotacao() {
  const { resumo, definirQtd, remover, limpar } = useLoja();
  const [tipo, setTipo] = useState<'cotacao' | 'pedido'>('cotacao');
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const nItens = resumo.grupos.reduce((a, g) => a + g.linhas.length, 0);

  const enviar = () => {
    if (!nome.trim()) return setErro('Informe o nome da sua loja ou empresa.');
    const d = soDigitos(tel);
    if (d.length !== 10 && d.length !== 11) return setErro('Informe um WhatsApp válido com DDD.');
    setErro('');
    // Fase 2: grava em cotacoes/cotacao_itens (anon pode inserir) e abre o WhatsApp do representante.
    limpar();
    setEnviado(true);
  };

  if (enviado)
    return (
      <div className="min-h-dvh">
        <TopoSimples titulo="Cotação enviada" />
        <div className="mx-auto grid max-w-md place-items-center px-6 py-16 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-folha-claro text-folha">
            <Icone n="check" className="size-10" forte />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-tinta">Recebemos sua {tipo === 'pedido' ? 'solicitação de pedido' : 'cotação'}!</h2>
          <p className="mt-2 text-suave">O representante vai responder pelo WhatsApp com os preços e prazos.</p>
          <Link href="/" className="btn-tinta mt-8">Voltar ao catálogo</Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-dvh pb-10">
      <TopoSimples titulo="Sua cotação" />
      {!nItens ? (
        <div className="mx-auto grid max-w-md place-items-center px-6 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-white text-suave ring-1 ring-linha">
            <Icone n="sacola" className="size-8" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-tinta">Sua cotação está vazia</h2>
          <p className="mt-1 text-sm text-suave">Abra um produto e toque em “Adicionar”.</p>
          <Link href="/" className="btn-tinta mt-6">Ver catálogo</Link>
        </div>
      ) : (
        <main className="mx-auto max-w-6xl px-4 pt-4 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:pt-8">
          <div className="space-y-4">
            {resumo.grupos.map((g) => {
              const cor = corCategoria(g.fornecedor.cor);
              const alvo = g.proxFaixa;
              return (
                <section key={g.fornecedor.id} className="cartao overflow-hidden">
                  <header className="flex items-center gap-3 border-b border-linha px-4 py-3">
                    <span className="grid size-9 place-items-center rounded-xl text-lg" style={{ background: cor.fundo }}>{g.fornecedor.logo}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-bold text-tinta">{g.fornecedor.nome}</h2>
                      <span className="text-[12px] text-suave">{g.linhas.length} {g.linhas.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    <span className="num font-display text-[16px] font-bold text-tinta">{dinheiro(g.total)}</span>
                  </header>
                  <ul className="divide-y divide-linha">
                    {g.linhas.map((l) => (
                      <li key={l.chave} className="flex gap-3 px-4 py-3.5">
                        <Link href={`/produto/?id=${l.produto.id}`} className="size-[72px] shrink-0 overflow-hidden rounded-xl bg-areia-2">
                          {l.produto.img_url ? <img src={miniatura(l.produto.img_url)!} alt="" loading="lazy" className="size-full object-cover" /> : <FotoVazia className="size-full" />}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p className="line-clamp-2 flex-1 text-[14px] font-medium leading-snug">{l.nome}</p>
                            <button onClick={() => remover(l.chave)} className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-suave hover:bg-areia" aria-label="Remover">
                              <Icone n="lixo" className="size-4" />
                            </button>
                          </div>
                          <p className="num mt-0.5 text-[12.5px] text-suave">
                            {l.preco < l.precoBase && <s className="mr-1">{dinheiro(l.precoBase)}</s>}
                            <span className={l.preco < l.precoBase ? 'font-semibold text-folha' : ''}>{dinheiro(l.preco)}</span> / un.
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Quantidade valor={l.qtd} passo={multiplo(l.produto)} min={0} onChange={(n) => definirQtd(l.chave, n)} />
                            <span className="num text-[14px] font-bold">{dinheiro(l.preco * l.qtd)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {(alvo || g.faltaMinimo > 0) && (
                    <div className="space-y-2 border-t border-linha bg-areia/60 px-4 py-3">
                      {alvo && (
                        <div>
                          <p className="num flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2c6a1c]">
                            <Icone n="baixa" className="size-4" forte /> Faltam {dinheiro(alvo - g.subBase)} para o próximo preço de atacado
                          </p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-folha/15">
                            <div className="h-full rounded-full bg-folha" style={{ width: `${Math.min(100, (g.subBase / alvo) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {g.faltaMinimo > 0 && (
                        <p className="num flex items-center gap-1.5 text-[12.5px] font-semibold text-alerta">
                          <Icone n="info" className="size-4" /> Pedido mínimo {dinheiro(g.fornecedor.pedido_minimo)} — faltam {dinheiro(g.faltaMinimo)}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
            <Link href="/" className="flex items-center justify-center gap-1.5 py-2 text-[14px] font-semibold text-marca">
              <Icone n="mais" className="size-4" forte /> Adicionar mais produtos
            </Link>
          </div>

          <aside className="mt-4 lg:mt-0">
            <div className="cartao p-5 lg:sticky lg:top-24">
              <div className="grid grid-cols-2 gap-1 rounded-full bg-areia p-1 text-[13px] font-semibold">
                {(['cotacao', 'pedido'] as const).map((t) => (
                  <button key={t} onClick={() => setTipo(t)} className={`rounded-full py-2 transition ${tipo === t ? 'bg-white text-tinta shadow-sm' : 'text-suave'}`}>
                    {t === 'cotacao' ? 'Pedir cotação' : 'Fazer pedido'}
                  </button>
                ))}
              </div>
              <dl className="num mt-5 space-y-2 text-[14px]">
                <div className="flex justify-between text-suave"><dt>Itens</dt><dd>{nItens}</dd></div>
                <div className="flex justify-between text-suave"><dt>Unidades</dt><dd>{resumo.unidades}</dd></div>
                <div className="flex items-end justify-between border-t border-linha pt-3">
                  <dt className="font-semibold">Total estimado</dt>
                  <dd className="font-display text-2xl font-extrabold text-tinta">{dinheiro(resumo.total)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-[12px] text-suave">Valores de referência. O representante confirma preço, frete e prazo.</p>
              <div className="mt-5 space-y-3">
                <div>
                  <label className="rotulo" htmlFor="nome">Nome da loja / empresa</label>
                  <input id="nome" className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Armarinho Boa Vista" />
                </div>
                <div>
                  <label className="rotulo" htmlFor="tel">Seu WhatsApp</label>
                  <input id="tel" className="campo num" inputMode="tel" value={tel} onChange={(e) => setTel(mascaraTel(e.target.value))} placeholder="(83) 90000-0000" />
                </div>
                {erro && <p className="rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">{erro}</p>}
                <button onClick={enviar} className="btn-folha h-13 w-full text-[16px]">
                  <IconeWhats className="size-5" /> {tipo === 'pedido' ? 'Enviar pedido' : 'Enviar cotação'}
                </button>
              </div>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
