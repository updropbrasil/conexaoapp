'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { Mini } from '@/components/Foto';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { excluirProduto, salvarFotos, salvarProduto } from '@/lib/admin';
import { dinheiro } from '@/lib/formato';
import { enviarFoto } from '@/lib/fotos';

export default function Pagina() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}

interface Var { nome: string; ref: string; preco: string }
interface Fx { min: string; preco: string }
interface FotoEd { url: string; file?: File }

const n = (s: string) => {
  const t = String(s).trim();
  if (!t) return null;
  const v = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return isNaN(v) ? null : v;
};
const br = (v: number | null | undefined) => (v == null ? '' : v.toFixed(2).replace('.', ','));
const kb = (b: number) => (b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(b / 1024) + ' KB');

function Editor() {
  const id = useSearchParams().get('id');
  const forn0 = useSearchParams().get('categoria');
  const router = useRouter();
  const { produtos, fornecedores, recarregar, avisar, falhar } = useAdmin();
  const p = produtos.find((x) => x.id === id);

  const [fotos, setFotos] = useState<FotoEd[]>([]);
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [forn, setForn] = useState('');
  const [linha, setLinha] = useState('');
  const [ref, setRef] = useState('');
  const [custo, setCusto] = useState('');
  const [mTipo, setMTipo] = useState<'pct' | 'fix'>('pct');
  const [mVal, setMVal] = useState('30');
  const [preco, setPreco] = useState('');
  const [mult, setMult] = useState('1');
  const [vars, setVars] = useState<Var[]>([]);
  const [fxs, setFxs] = useState<Fx[]>([]);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (carregado) return;
    if (!id) {
      setForn(forn0 || fornecedores[0]?.id || '');
      if (fornecedores.length) setCarregado(true);
      return;
    }
    if (!p) return;
    setFotos(p.produto_fotos.map((f) => ({ url: f.url })).concat(!p.produto_fotos.length && p.img_url ? [{ url: p.img_url }] : []));
    setNome(p.nome);
    setForn(p.fornecedor_id);
    setLinha(p.categoria ?? '');
    setRef(p.ref ?? '');
    setCusto(br(p.custo));
    setMTipo(p.margem_tipo ?? 'pct');
    setMVal(p.margem_val == null ? '30' : String(p.margem_val).replace('.', ','));
    setPreco(br(p.preco));
    setMult(String(p.min_mult ?? 1));
    setVars(p.produto_variacoes.map((v) => ({ nome: v.nome, ref: v.ref ?? '', preco: br(v.preco) })));
    setFxs(p.produto_faixas.map((f) => ({ min: br(f.min_valor), preco: br(f.preco) })));
    setCarregado(true);
  }, [id, p, fornecedores, forn0, carregado]);

  const c = n(custo);
  const m = n(mVal) ?? 0;
  const sugerido = c == null ? null : Math.round((mTipo === 'pct' ? c * (1 + m / 100) : c + m) * 100) / 100;
  const linhas = [...new Set(produtos.filter((x) => x.fornecedor_id === forn).map((x) => x.categoria).filter(Boolean))] as string[];

  const mover = (k: number, d: number) => {
    const a = [...fotos];
    const j = k + d;
    if (j < 0 || j >= a.length) return;
    [a[k], a[j]] = [a[j], a[k]];
    setFotos(a);
  };
  const tirar = (k: number) => {
    const f = fotos[k];
    if (!f.file) setRemovidas([...removidas, f.url]);
    setFotos(fotos.filter((_, i) => i !== k));
  };

  const salvar = async () => {
    if (!nome.trim()) return setErro('Informe o nome do produto.');
    if (!forn) return setErro('Escolha a categoria.');
    const pv = n(preco) ?? sugerido;
    const vs = vars.filter((v) => v.nome.trim());
    if (pv == null && !vs.length) return setErro('Informe o preço de venda (ou o custo + margem).');
    if (vs.some((v) => n(v.preco) == null)) return setErro('Toda opção precisa de preço.');
    const fx = fxs.filter((f) => f.min || f.preco);
    if (fx.some((f) => n(f.min) == null || n(f.preco) == null)) return setErro('Preencha valor e preço em todas as faixas.');
    setErro('');
    try {
      setSalvando('Salvando produto…');
      const pid = await salvarProduto(
        p?.id ?? null,
        { fornecedor_id: forn, nome: nome.trim(), ref: ref.trim() || null, categoria: linha.trim() || null, custo: c, margem_tipo: mTipo, margem_val: m, preco: pv ?? Math.min(...vs.map((v) => n(v.preco)!)), min_mult: Math.max(1, parseInt(mult) || 1) },
        vs.map((v) => ({ nome: v.nome.trim(), ref: v.ref.trim() || null, preco: n(v.preco)! })),
        fx.map((f) => ({ min_valor: n(f.min)!, preco: n(f.preco)! })),
      );
      const urls: string[] = [];
      let antes = 0;
      let depois = 0;
      let k = 0;
      const novas = fotos.filter((f) => f.file).length;
      for (const f of fotos) {
        if (f.file) {
          setSalvando(`Enviando foto ${++k} de ${novas}…`);
          const r = await enviarFoto(pid, f.file);
          antes += r.bytesOriginal;
          depois += r.bytesGrande + r.bytesMini;
          urls.push(r.url);
        } else urls.push(f.url);
      }
      await salvarFotos(pid, urls, removidas);
      await recarregar();
      avisar(novas ? `Salvo · fotos ${kb(antes)} → ${kb(depois)}` : 'Produto salvo');
      router.replace('/painel/produtos/');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(null);
    }
  };

  const excluir = async () => {
    if (!p || !confirm(`Excluir "${p.nome}"? As fotos também serão apagadas.`)) return;
    try {
      await excluirProduto(p);
      await recarregar();
      avisar('Produto excluído');
      router.replace('/painel/produtos/');
    } catch (e) {
      falhar(e);
    }
  };

  if (id && !p) return <PainelTopo titulo="Carregando…" voltar="/painel/produtos/" />;

  return (
    <>
      <PainelTopo titulo={p ? 'Editar produto' : 'Novo produto'} sub={p ? (p.ref ?? undefined) : 'Preencha e salve'} voltar="/painel/produtos/" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-4">
        <Secao titulo="Fotos" dica="A primeira é a capa. Use as setas para mudar a ordem.">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {fotos.map((f, k) => (
              <div key={f.url} className="relative aspect-square overflow-hidden rounded-xl bg-areia-2 ring-1 ring-linha">
                {f.file ? <img src={f.url} alt="" className="size-full object-cover" /> : <Mini url={f.url} className="size-full object-cover" />}
                {k === 0 && <span className="pilula absolute left-1.5 top-1.5 bg-tinta text-white">Capa</span>}
                {f.file && <span className="pilula absolute bottom-1.5 right-1.5 bg-folha text-white">nova</span>}
                <button onClick={() => tirar(k)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white" aria-label="Remover foto">
                  <Icone n="x" className="size-3.5" forte />
                </button>
                {fotos.length > 1 && (
                  <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                    {k > 0 && <button onClick={() => mover(k, -1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-tinta" aria-label="Mover para a esquerda"><Icone n="esq" className="size-4" forte /></button>}
                    {k < fotos.length - 1 && <button onClick={() => mover(k, 1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-tinta" aria-label="Mover para a direita"><Icone n="dir" className="size-4" forte /></button>}
                  </div>
                )}
              </div>
            ))}
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-linha bg-areia/50 text-center text-suave transition hover:border-marca hover:text-marca">
              <span className="grid place-items-center gap-1 px-2">
                <Icone n="upload" className="size-6" />
                <span className="text-[12px] font-semibold leading-tight">Adicionar fotos</span>
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  setFotos([...fotos, ...[...(e.target.files ?? [])].map((file) => ({ url: URL.createObjectURL(file), file }))]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-marca-claro px-3 py-2.5 text-[12.5px] leading-snug text-marca">
            <Icone n="info" className="mt-px size-4 shrink-0" />
            Pode mandar a foto do celular do jeito que está: ao salvar, o app reduz para 1200 px (WebP) e cria a miniatura de 300 px — em geral 100 a 250 KB por foto (miniatura ~30 KB).
          </p>
        </Secao>

        <Secao titulo="Informações">
          <Campo rotulo="Nome do produto">
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cobertor Microfibra Casal 1,80x2,00" />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Categoria">
              <select className="campo" value={forn} onChange={(e) => setForn(e.target.value)}>
                {!forn && <option value="">Escolha…</option>}
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
            <input className="campo num font-display text-lg font-bold text-tinta" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder={sugerido != null ? br(sugerido) : '0,00'} />
          </Campo>
          {sugerido != null && n(preco) !== sugerido && (
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
                  <input className="campo num px-2.5 py-2.5 text-[12.5px]" value={v.ref} placeholder="SKU" onChange={(e) => setVars(vars.map((x, i) => (i === k ? { ...x, ref: e.target.value.toUpperCase() } : x)))} />
                  <input className="campo num px-3 py-2.5" value={v.preco} placeholder="R$" inputMode="decimal" onChange={(e) => setVars(vars.map((x, i) => (i === k ? { ...x, preco: e.target.value } : x)))} />
                  <button onClick={() => setVars(vars.filter((_, i) => i !== k))} className="grid size-9 place-items-center rounded-full text-perigo hover:bg-perigo-claro" aria-label="Remover opção"><Icone n="lixo" className="size-4" /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setVars([...vars, { nome: '', ref: ref ? ref + '-' : '', preco: preco || br(sugerido) }])} className="btn-claro btn-sm mt-3"><Icone n="mais" className="size-4" forte /> Adicionar opção</button>
        </Secao>

        <Secao titulo="Preço de atacado (faixas)" dica="Preço menor quando a cotação do cliente nesta categoria passa de um valor. Não vale para opções.">
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
        {erro && <p className="rounded-xl bg-perigo-claro px-3 py-2.5 text-[13.5px] font-medium text-perigo">{erro}</p>}
      </div>

      <div className="pb-seguro fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-3xl gap-2">
          {p && <button onClick={excluir} className="btn-claro px-4 text-perigo" aria-label="Excluir produto"><Icone n="lixo" /></button>}
          <button onClick={salvar} disabled={!!salvando} className="btn-tinta flex-1"><Icone n="check" forte /> {salvando ?? 'Salvar produto'}</button>
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
