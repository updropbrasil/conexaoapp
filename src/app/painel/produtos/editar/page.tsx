'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Icone } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { PainelTopo } from '@/components/PainelTopo';
import { dinheiro, miniatura } from '@/lib/formato';

export default function Pagina() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}

interface Var { nome: string; ref: string; preco: string }
interface Fx { min: string; preco: string }

const n = (s: string) => {
  const v = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
  return isNaN(v) ? null : v;
};
const br = (v: number | null | undefined) => (v == null ? '' : v.toFixed(2).replace('.', ','));

function Editor() {
  const id = useSearchParams().get('id');
  const { produtos, fornecedores } = useLoja();
  const p = produtos.find((x) => x.id === id);

  const [fotos, setFotos] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [forn, setForn] = useState(fornecedores[0].id);
  const [linha, setLinha] = useState('');
  const [ref, setRef] = useState('');
  const [custo, setCusto] = useState('');
  const [mTipo, setMTipo] = useState<'pct' | 'fix'>('pct');
  const [mVal, setMVal] = useState('30');
  const [preco, setPreco] = useState('');
  const [mult, setMult] = useState('1');
  const [vars, setVars] = useState<Var[]>([]);
  const [fxs, setFxs] = useState<Fx[]>([]);

  useEffect(() => {
    if (!p) return;
    setFotos([...p.produto_fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.url));
    setNome(p.nome);
    setForn(p.fornecedor_id);
    setLinha(p.categoria ?? '');
    setRef(p.ref ?? '');
    setCusto(br(p.custo));
    setMTipo(p.margem_tipo ?? 'pct');
    setMVal(String(p.margem_val ?? 30));
    setPreco(br(p.preco));
    setMult(String(p.min_mult ?? 1));
    setVars(p.produto_variacoes.map((v) => ({ nome: v.nome, ref: v.ref ?? '', preco: br(v.preco) })));
    setFxs(p.produto_faixas.map((f) => ({ min: br(f.min_valor), preco: br(f.preco) })));
  }, [p]);

  const c = n(custo);
  const m = n(mVal) ?? 0;
  const sugerido = c == null ? null : Math.round((mTipo === 'pct' ? c * (1 + m / 100) : c + m) * 100) / 100;
  const linhas = [...new Set(produtos.filter((x) => x.fornecedor_id === forn).map((x) => x.categoria).filter(Boolean))] as string[];

  return (
    <>
      <PainelTopo titulo={p ? 'Editar produto' : 'Novo produto'} sub={p ? (p.ref ?? undefined) : 'Preencha e salve'} voltar="/painel/produtos/" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-4">
        <Secao titulo="Fotos" dica="A primeira é a capa. Arraste para mudar a ordem.">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {fotos.map((u, k) => (
              <div key={u} className="group relative aspect-square overflow-hidden rounded-xl bg-areia-2 ring-1 ring-linha">
                <img src={miniatura(u) ?? u} alt="" className="size-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).src = u)} />
                {k === 0 && <span className="pilula absolute left-1.5 top-1.5 bg-tinta text-white">Capa</span>}
                <button onClick={() => setFotos(fotos.filter((x) => x !== u))} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white" aria-label="Remover foto">
                  <Icone n="x" className="size-3.5" forte />
                </button>
                <span className="absolute bottom-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-white/85 text-suave"><Icone n="arrastar" className="size-4" forte /></span>
              </div>
            ))}
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-linha bg-areia/50 text-center text-suave transition hover:border-marca hover:text-marca">
              <span className="grid place-items-center gap-1 px-2">
                <Icone n="upload" className="size-6" />
                <span className="text-[12px] font-semibold leading-tight">Adicionar fotos</span>
              </span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFotos([...fotos, ...[...(e.target.files ?? [])].map((f) => URL.createObjectURL(f))])} />
            </label>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-marca-claro px-3 py-2.5 text-[12.5px] leading-snug text-marca">
            <Icone n="info" className="mt-px size-4 shrink-0" />
            Pode mandar a foto do celular do jeito que está: antes de enviar, o app reduz para 1200 px (WebP) e cria a miniatura de 300 px — cerca de 100 KB por foto.
          </p>
        </Secao>

        <Secao titulo="Informações">
          <Campo rotulo="Nome do produto">
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cobertor Microfibra Casal 1,80x2,00" />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Categoria">
              <select className="campo" value={forn} onChange={(e) => setForn(e.target.value)}>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.logo} {f.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Linha (subcategoria)">
              <input className="campo" list="linhas" value={linha} onChange={(e) => setLinha(e.target.value)} placeholder="Ex.: Cobertores" />
              <datalist id="linhas">{linhas.map((l) => <option key={l} value={l} />)}</datalist>
            </Campo>
          </div>
          <Campo rotulo="Referência (SKU)">
            <input className="campo num" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="Ex.: COB-LISO-CAS" />
          </Campo>
        </Secao>

        <Secao titulo="Preço">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Custo (R$)">
              <input className="campo num" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="0,00" />
            </Campo>
            <Campo rotulo="Margem">
              <div className="flex gap-2">
                <div className="grid shrink-0 grid-cols-2 rounded-xl bg-areia p-1 text-[13px] font-bold">
                  {(['pct', 'fix'] as const).map((t) => (
                    <button key={t} onClick={() => setMTipo(t)} className={`rounded-lg px-2.5 ${mTipo === t ? 'bg-white text-tinta shadow-sm' : 'text-suave'}`}>{t === 'pct' ? '%' : 'R$'}</button>
                  ))}
                </div>
                <input className="campo num min-w-0" inputMode="decimal" value={mVal} onChange={(e) => setMVal(e.target.value)} />
              </div>
            </Campo>
          </div>
          <Campo rotulo="Preço de venda (R$)">
            <input className="campo num font-display text-lg font-bold text-tinta" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" />
          </Campo>
          {sugerido != null && (
            <button onClick={() => setPreco(br(sugerido))} className="num -mt-1 flex w-full items-center justify-between rounded-xl bg-folha-claro px-3 py-2.5 text-left text-[13px] text-[#2c6a1c]">
              <span>Custo {dinheiro(c)} + {mTipo === 'pct' ? `${m}%` : dinheiro(m)} = <b>{dinheiro(sugerido)}</b></span>
              <span className="font-semibold">Usar</span>
            </button>
          )}
          <Campo rotulo="Vendido em múltiplos de (unidades)">
            <input className="campo num" inputMode="numeric" value={mult} onChange={(e) => setMult(e.target.value.replace(/\D/g, ''))} />
          </Campo>
        </Secao>

        <Secao titulo="Opções (variações)" dica="Tamanho, cor, moldura… Cada opção pode ter preço e referência próprios.">
          {vars.length > 0 && (
            <div className="space-y-2">
              {vars.map((v, k) => (
                <div key={k} className="grid grid-cols-[minmax(52px,.6fr)_1.6fr_78px_36px] items-center gap-2">
                  <input className="campo px-3 py-2.5" value={v.nome} placeholder="Nome" onChange={(e) => setVars(vars.map((x, i) => (i === k ? { ...x, nome: e.target.value } : x)))} />
                  <input className="campo num px-2.5 py-2.5 text-[12.5px]" value={v.ref} placeholder="SKU" onChange={(e) => setVars(vars.map((x, i) => (i === k ? { ...x, ref: e.target.value } : x)))} />
                  <input className="campo num px-3 py-2.5" value={v.preco} placeholder="R$" inputMode="decimal" onChange={(e) => setVars(vars.map((x, i) => (i === k ? { ...x, preco: e.target.value } : x)))} />
                  <button onClick={() => setVars(vars.filter((_, i) => i !== k))} className="grid size-9 place-items-center rounded-full text-perigo hover:bg-perigo-claro" aria-label="Remover opção"><Icone n="lixo" className="size-4" /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setVars([...vars, { nome: '', ref: '', preco: preco }])} className="btn-claro btn-sm mt-3"><Icone n="mais" className="size-4" forte /> Adicionar opção</button>
        </Secao>

        <Secao titulo="Preço de atacado (faixas)" dica="Preço menor quando a cotação do cliente nesta categoria passa de um valor.">
          {fxs.length > 0 && (
            <div className="space-y-2">
              {fxs.map((f, k) => (
                <div key={k} className="flex items-center gap-2 text-[13px] text-suave">
                  <span className="shrink-0">A partir de</span>
                  <input className="campo num min-w-0 px-3 py-2.5" value={f.min} inputMode="decimal" placeholder="R$" onChange={(e) => setFxs(fxs.map((x, i) => (i === k ? { ...x, min: e.target.value } : x)))} />
                  <span className="shrink-0">→</span>
                  <input className="campo num w-24 shrink-0 px-3 py-2.5 font-semibold text-[#2c6a1c]" value={f.preco} inputMode="decimal" placeholder="R$" onChange={(e) => setFxs(fxs.map((x, i) => (i === k ? { ...x, preco: e.target.value } : x)))} />
                  <button onClick={() => setFxs(fxs.filter((_, i) => i !== k))} className="grid size-9 shrink-0 place-items-center rounded-full text-perigo hover:bg-perigo-claro" aria-label="Remover faixa"><Icone n="lixo" className="size-4" /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setFxs([...fxs, { min: '', preco: '' }])} className="btn-claro btn-sm mt-3"><Icone n="mais" className="size-4" forte /> Adicionar faixa</button>
        </Secao>
      </div>

      <div className="pb-seguro fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-3xl gap-2">
          {p && <button className="btn-claro px-4 text-perigo" aria-label="Excluir produto"><Icone n="lixo" /></button>}
          <button className="btn-tinta flex-1"><Icone n="check" forte /> Salvar produto</button>
        </div>
      </div>
    </>
  );
}

function Secao({ titulo, dica, children }: { titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <section className="cartao p-4 sm:p-5">
      <h2 className="text-[16px] font-bold text-tinta">{titulo}</h2>
      {dica && <p className="mt-0.5 text-[12.5px] text-suave">{dica}</p>}
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );
}
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="rotulo">{rotulo}</span>
      {children}
    </div>
  );
}
