'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FotoVazia } from '@/components/CartaoProduto';
import { Icone } from '@/components/Icone';
import { useAdmin } from '@/components/Admin';
import { Mini } from '@/components/Foto';
import { PainelTopo } from '@/components/PainelTopo';
import { dinheiro, normTxt } from '@/lib/formato';
import { multiplo, precoBase, temVariacao } from '@/lib/preco';

export default function GestaoProdutos() {
  const { produtos, fornecedores } = useAdmin();
  const [cat, setCat] = useState('');
  const [busca, setBusca] = useState('');
  const cont = useMemo(() => {
    const m: Record<string, number> = {};
    produtos.forEach((p) => (m[p.fornecedor_id] = (m[p.fornecedor_id] || 0) + 1));
    return m;
  }, [produtos]);
  const lista = produtos.filter((p) => (!cat || p.fornecedor_id === cat) && (!busca || normTxt(p.nome + ' ' + p.ref).includes(normTxt(busca))));
  const semFoto = produtos.filter((p) => !p.img_url).length;
  const nomeCat = (id: string) => fornecedores.find((f) => f.id === id);

  return (
    <>
      <PainelTopo
        titulo="Produtos"
        sub={`${produtos.length} cadastrados${semFoto ? ` · ${semFoto} sem foto` : ''}`}
        acoes={
          <div className="flex gap-2">
            <Link href="/painel/importar/" className="btn-claro btn-sm h-10">
              <Icone n="upload" className="size-4" /> <span className="hidden sm:inline">Importar catálogo</span><span className="sm:hidden">Importar</span>
            </Link>
            <Link href="/painel/produtos/editar/" className="btn-tinta btn-sm hidden h-10 sm:inline-flex">
              <Icone n="mais" className="size-4" forte /> Novo produto
            </Link>
          </div>
        }
      />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 ring-1 ring-linha focus-within:ring-2 focus-within:ring-marca/30">
          <Icone n="busca" className="size-5 text-suave" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou referência" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <div className="sem-barra -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {[{ id: '', nome: 'Todas', logo: '' }, ...fornecedores].map((f) => (
            <button key={f.id || 'todas'} onClick={() => setCat(f.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${cat === f.id ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>
              {f.logo ? `${f.logo} ` : ''}
              {f.nome} <span className="num opacity-60">{f.id ? (cont[f.id] ?? 0) : produtos.length}</span>
            </button>
          ))}
        </div>

        {!produtos.length && (
          <div className="cartao mt-4 grid place-items-center gap-2 px-6 py-12 text-center">
            <Icone n="caixa" className="size-8 text-suave/60" />
            <p className="font-semibold text-tinta">Nenhum produto ainda</p>
            <p className="max-w-xs text-sm text-suave">{fornecedores.length ? 'Cadastre um por um ou importe o catálogo do fornecedor de uma vez.' : 'Comece criando as categorias (ex.: Moda Praia) em Mais › Categorias.'}</p>
            <Link href={fornecedores.length ? '/painel/importar/' : '/painel/categorias/'} className="btn-tinta btn-sm mt-2">{fornecedores.length ? 'Importar catálogo' : 'Criar categorias'}</Link>
          </div>
        )}
        <ul className={`cartao mt-4 divide-y divide-linha overflow-hidden ${lista.length ? '' : 'hidden'}`}>
          {lista.map((p) => {
            const f = nomeCat(p.fornecedor_id);
            return (
              <li key={p.id}>
                <Link href={`/painel/produtos/editar/?id=${p.id}`} className="flex items-center gap-3 px-3 py-3 transition hover:bg-areia/60 sm:px-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-areia-2">
                    {p.img_url ? <Mini url={p.img_url} className="size-full object-cover" /> : <FotoVazia className="size-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[14px] font-medium leading-snug">{p.nome}</p>
                    <p className="num mt-0.5 truncate text-[12px] text-suave">
                      {f?.logo} {f?.nome}
                      {p.ref ? ` · ${p.ref}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.produto_fotos.length ? (
                        <span className="pilula num bg-areia text-suave"><Icone n="foto" className="size-3" /> {p.produto_fotos.length}</span>
                      ) : (
                        <span className="pilula bg-alerta-claro text-alerta">Sem foto</span>
                      )}
                      {temVariacao(p) && <span className="pilula num bg-marca-claro text-marca">{p.produto_variacoes.length} opções</span>}
                      {p.produto_faixas.length > 0 && <span className="pilula bg-folha-claro text-[#2c6a1c]">Atacado</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num font-display text-[15px] font-bold text-tinta">{dinheiro(precoBase(p))}</p>
                    <p className="num text-[11.5px] text-suave">mín. {multiplo(p)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Link href="/painel/produtos/editar/" className="fixed bottom-24 right-4 z-30 grid size-14 place-items-center rounded-full bg-tinta text-white shadow-[var(--shadow-flutua)] sm:hidden" aria-label="Novo produto">
        <Icone n="mais" className="size-6" forte />
      </Link>
    </>
  );
}
