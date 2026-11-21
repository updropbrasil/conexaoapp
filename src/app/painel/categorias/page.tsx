'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { Folha } from '@/components/Folha';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { excluirFornecedor, salvarFornecedor } from '@/lib/admin';
import { CORES_CATEGORIA, corCategoria, dinheiro } from '@/lib/formato';
import type { Fornecedor } from '@/lib/types';

const EMOJIS = ['🛏️', '🏃', '👙', '🏠', '👕', '🧦', '🧵', '🎧', '🔧', '🧸', '👟', '🍳', '💄', '🎁', '🏭'];

export default function Categorias() {
  const { fornecedores, produtos, recarregar, avisar, falhar } = useAdmin();
  const [edit, setEdit] = useState<Fornecedor | 'novo' | null>(null);
  const [nome, setNome] = useState('');
  const [logo, setLogo] = useState('🏭');
  const [cor, setCor] = useState(0);
  const [minimo, setMinimo] = useState('');
  const abrir = (f: Fornecedor | 'novo') => {
    setEdit(f);
    const x = f === 'novo' ? null : f;
    setNome(x?.nome ?? '');
    setLogo(x?.logo || '🏭');
    setCor(x?.cor ?? fornecedores.length % CORES_CATEGORIA.length);
    setMinimo(x?.pedido_minimo != null ? String(x.pedido_minimo).replace('.', ',') : '');
  };
  const atual = edit && edit !== 'novo' ? edit : null;
  const salvar = async () => {
    if (!nome.trim()) return alert('Informe o nome.');
    try {
      const v = parseFloat(minimo.replace(/\./g, '').replace(',', '.'));
      await salvarFornecedor(atual?.id ?? null, { nome: nome.trim(), logo, cor, pedido_minimo: isNaN(v) ? null : v });
      await recarregar();
      setEdit(null);
      avisar('Categoria salva');
    } catch (e) {
      falhar(e);
    }
  };
  const excluir = async () => {
    if (!atual) return;
    const n = produtos.filter((p) => p.fornecedor_id === atual.id).length;
    if (!confirm(`Excluir "${atual.nome}" e TODOS os ${n} produtos dela?`)) return;
    try {
      await excluirFornecedor(atual.id, produtos);
      await recarregar();
      setEdit(null);
      avisar('Categoria excluída');
    } catch (e) {
      falhar(e);
    }
  };
  return (
    <>
      <PainelTopo titulo="Categorias" sub="Cada categoria é um fornecedor no banco" acoes={<button onClick={() => abrir('novo')} className="btn-tinta btn-sm h-10"><Icone n="mais" className="size-4" forte /> Nova</button>} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {fornecedores.map((f) => {
            const c = corCategoria(f.cor);
            const n = produtos.filter((p) => p.fornecedor_id === f.id).length;
            return (
              <li key={f.id} className="cartao flex min-w-0 items-center gap-2.5 p-3.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: c.fundo }}>{f.logo || '🏭'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{f.nome}</p>
                  <p className="num truncate text-[12.5px] text-suave">{n} produtos · {f.pedido_minimo ? `mín. ${dinheiro(f.pedido_minimo)}` : 'sem mínimo'}</p>
                </div>
                <Link href={`/painel/produtos/editar/?categoria=${f.id}`} className="grid size-10 place-items-center rounded-full bg-areia text-tinta" aria-label="Novo produto nesta categoria"><Icone n="mais" className="size-4" forte /></Link>
                <button onClick={() => abrir(f)} className="grid size-10 place-items-center rounded-full bg-areia text-tinta" aria-label={`Editar ${f.nome}`}><Icone n="lapis" className="size-4" /></button>
              </li>
            );
          })}
        </ul>
        {!fornecedores.length && <p className="cartao px-4 py-10 text-center text-suave">Nenhuma categoria. Toque em “Nova” — ex.: Moda Praia, Cama Mesa e Banho.</p>}
      </div>
      <Folha
        titulo={atual ? 'Editar categoria' : 'Nova categoria'}
        aberta={edit !== null}
        onFechar={() => setEdit(null)}
        rodape={<div className="flex gap-2">{atual && <button onClick={excluir} className="btn-claro px-4 text-perigo" aria-label="Excluir categoria"><Icone n="lixo" /></button>}<button onClick={salvar} className="btn-tinta flex-1">Salvar</button></div>}
      >
        <div className="space-y-4">
          <label className="block"><span className="rotulo">Nome</span><input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Moda Praia" /></label>
          <div>
            <span className="rotulo">Ícone</span>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => <button key={e} onClick={() => setLogo(e)} className={`grid size-11 place-items-center rounded-xl text-xl ${logo === e ? 'bg-tinta' : 'bg-white ring-1 ring-linha'}`}>{e}</button>)}
              <input className="campo w-16 text-center text-xl" maxLength={4} value={logo} onChange={(e) => setLogo(e.target.value)} aria-label="Outro emoji" />
            </div>
          </div>
          <div>
            <span className="rotulo">Cor</span>
            <div className="flex flex-wrap gap-2">
              {CORES_CATEGORIA.map((c, k) => <button key={k} onClick={() => setCor(k)} className={`size-10 rounded-full ring-2 ${cor === k ? 'ring-tinta' : 'ring-transparent'}`} style={{ background: c.fundo, boxShadow: `inset 0 0 0 6px ${c.fundo}, inset 0 0 0 20px ${c.texto}` }} aria-label={`Cor ${k + 1}`} />)}
            </div>
          </div>
          <label className="block"><span className="rotulo">Pedido mínimo (R$) — opcional</span><input className="campo num" inputMode="decimal" value={minimo} onChange={(e) => setMinimo(e.target.value)} placeholder="Ex.: 1500" /></label>
        </div>
      </Folha>
    </>
  );
}
