'use client';
import { useMemo, useState } from 'react';
import { Icone } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { PainelTopo } from '@/components/PainelTopo';
import { dinheiro } from '@/lib/formato';
import { lerLista, PROMPT_CLAUDE, type LinhaImp } from '@/lib/importar';

type Acao = 'atualizar' | 'pular';

export default function Importar() {
  const { produtos, fornecedores } = useLoja();
  const [cat, setCat] = useState(fornecedores[0].id);
  const [margemTipo, setMargemTipo] = useState<'pct' | 'fix'>('pct');
  const [margem, setMargem] = useState('30');
  const [txt, setTxt] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [acoes, setAcoes] = useState<Record<number, Acao>>({});

  const r = useMemo(
    () => lerLista(txt, { margemTipo, margem: parseFloat(margem.replace(',', '.')) || 0, valoresSaoCusto: true, categoriaId: cat, existentes: produtos }),
    [txt, margemTipo, margem, cat, produtos],
  );
  const acao = (l: LinhaImp): Acao | 'criar' | 'erro' => (l.erro ? 'erro' : l.duplicado || l.dupNoArquivo ? (acoes[l.n] ?? (l.dupNoArquivo ? 'pular' : 'atualizar')) : 'criar');
  const cont = { criar: 0, atualizar: 0, pular: 0, erro: 0 };
  r.linhas.forEach((l) => cont[acao(l)]++);
  const nDup = r.linhas.filter((l) => l.duplicado || l.dupNoArquivo).length;
  const f = fornecedores.find((x) => x.id === cat)!;

  return (
    <>
      <PainelTopo titulo="Importar catálogo" sub="PDF do fornecedor → Claude → lista → aqui" voltar="/painel/produtos/" />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-36 pt-4">
        <Passo n={1} titulo="Para onde vão os produtos">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <span className="rotulo">Categoria</span>
              <select className="campo" value={cat} onChange={(e) => setCat(e.target.value)}>
                {fornecedores.map((x) => (
                  <option key={x.id} value={x.id}>{x.logo} {x.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="rotulo">Margem sobre o custo</span>
              <div className="flex gap-2">
                <div className="grid shrink-0 grid-cols-2 rounded-xl bg-areia p-1 text-[13px] font-bold">
                  {(['pct', 'fix'] as const).map((t) => (
                    <button key={t} onClick={() => setMargemTipo(t)} className={`rounded-lg px-2.5 ${margemTipo === t ? 'bg-white text-tinta shadow-sm' : 'text-suave'}`}>{t === 'pct' ? '%' : 'R$'}</button>
                  ))}
                </div>
                <input className="campo num min-w-0" inputMode="decimal" value={margem} onChange={(e) => setMargem(e.target.value)} />
              </div>
            </div>
          </div>
        </Passo>

        <Passo n={2} titulo="Cole a lista que o Claude gerou" dica="Aceita JSON ou CSV (separado por ; , ou tab).">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(PROMPT_CLAUDE).catch(() => {});
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
            className="flex w-full items-center gap-3 rounded-xl bg-marca-claro px-3.5 py-3 text-left text-marca"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white"><Icone n={copiado ? 'check' : 'copiar'} className="size-5" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <b className="block text-[14px]">{copiado ? 'Instruções copiadas!' : 'Copiar instruções para o Claude'}</b>
              <span className="text-[12.5px] opacity-80">Cole no Claude junto com o PDF do fornecedor</span>
            </span>
          </button>
          <textarea
            value={txt}
            onChange={(e) => {
              setTxt(e.target.value);
              setAcoes({});
            }}
            rows={6}
            spellCheck={false}
            placeholder={'[\n  { "nome": "...", "ref": "...", "custo": 12.30, "min": 40 }\n]'}
            className="campo num font-mono text-[12.5px] leading-relaxed"
          />
          {r.erroGeral && <p className="rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">{r.erroGeral}</p>}
        </Passo>

        {r.linhas.length > 0 && (
          <Passo n={3} titulo="Confira antes de importar" dica={`${r.linhas.length} linhas lidas (${r.formato?.toUpperCase()}) · preço de venda já com a margem`}>
            <div className="flex flex-wrap gap-2">
              <Contador cor="bg-folha-claro text-[#2c6a1c]" n={cont.criar} t="novos" />
              <Contador cor="bg-alerta-claro text-alerta" n={nDup} t="duplicados" />
              {cont.erro > 0 && <Contador cor="bg-perigo-claro text-perigo" n={cont.erro} t="com erro" />}
            </div>
            {nDup > 0 && (
              <p className="flex items-start gap-2 text-[12.5px] text-suave">
                <Icone n="alerta" className="mt-px size-4 shrink-0 text-alerta" /> Duplicado = mesma referência ou mesmo nome já cadastrado em {f.nome}. Escolha atualizar (troca preço/custo/mínimo) ou pular.
              </p>
            )}
            <ul className="-mx-4 divide-y divide-linha border-y border-linha sm:hidden">
              {r.linhas.map((l) => {
                const a = acao(l);
                const dup = !!(l.duplicado || l.dupNoArquivo);
                return (
                  <li key={l.n} className={`px-4 py-3 ${a === 'erro' ? 'bg-perigo-claro/70' : dup ? 'bg-alerta-claro/80' : ''} ${a === 'pular' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-snug">{l.nome || <i className="text-perigo">(sem nome)</i>}</p>
                        <p className="num mt-0.5 text-[12px] text-suave">
                          {l.ref || 'sem ref.'}
                          {l.linha ? ` · ${l.linha}` : ''}
                          {l.opcoes.length ? ` · ${l.opcoes.length} opções` : ''} · mín. {l.min}
                        </p>
                      </div>
                      <div className="num shrink-0 text-right">
                        <p className="text-[14px] font-bold text-tinta">{l.preco != null ? dinheiro(l.preco) : '—'}</p>
                        <p className="text-[11.5px] text-suave">custo {l.custo != null ? dinheiro(l.custo) : '—'}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {a === 'erro' ? (
                        <span className="pilula bg-perigo text-white">Erro: {l.erro}</span>
                      ) : dup ? (
                        <>
                          <div className="inline-grid grid-cols-2 rounded-full bg-white p-0.5 text-[12px] font-semibold ring-1 ring-alerta/30">
                            {(['atualizar', 'pular'] as const).map((x) => (
                              <button key={x} disabled={x === 'atualizar' && l.dupNoArquivo && !l.duplicado} onClick={() => setAcoes({ ...acoes, [l.n]: x })} className={`rounded-full px-3 py-1 disabled:opacity-30 ${a === x ? 'bg-alerta text-white' : 'text-alerta'}`}>
                                {x === 'atualizar' ? 'Atualizar' : 'Pular'}
                              </button>
                            ))}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-alerta">{l.duplicado ? `Já existe (${dinheiro(l.duplicado.preco)})` : 'Repetido nesta lista'}</span>
                        </>
                      ) : (
                        <span className="pilula bg-folha text-white">Novo</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
              <table className="num w-full border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-suave">
                    <th className="py-2 pl-4 sm:pl-3">Situação</th>
                    <th className="py-2">Produto</th>
                    <th className="py-2 text-right">Custo</th>
                    <th className="py-2 text-right">Venda</th>
                    <th className="py-2 pr-4 text-right sm:pr-3">Mín.</th>
                  </tr>
                </thead>
                <tbody>
                  {r.linhas.map((l) => {
                    const a = acao(l);
                    const dup = !!(l.duplicado || l.dupNoArquivo);
                    const fundo = a === 'erro' ? 'bg-perigo-claro/70' : dup ? 'bg-alerta-claro/80' : '';
                    return (
                      <tr key={l.n} className={`${fundo} ${a === 'pular' ? 'opacity-55' : ''}`}>
                        <td className="border-t border-linha py-2.5 pl-4 align-top sm:pl-3">
                          {a === 'erro' ? (
                            <span className="pilula bg-perigo text-white">Erro</span>
                          ) : dup ? (
                            <div className="inline-grid grid-cols-2 rounded-full bg-white p-0.5 text-[11.5px] font-semibold ring-1 ring-alerta/30">
                              {(['atualizar', 'pular'] as const).map((x) => (
                                <button key={x} disabled={x === 'atualizar' && l.dupNoArquivo && !l.duplicado} onClick={() => setAcoes({ ...acoes, [l.n]: x })} className={`rounded-full px-2.5 py-1 disabled:opacity-30 ${a === x ? 'bg-alerta text-white' : 'text-alerta'}`}>
                                  {x === 'atualizar' ? 'Atualizar' : 'Pular'}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="pilula bg-folha text-white">Novo</span>
                          )}
                        </td>
                        <td className="border-t border-linha py-2.5 pr-3 align-top">
                          <p className="font-medium leading-snug text-texto">{l.nome || <i className="text-perigo">(sem nome)</i>}</p>
                          <p className="mt-0.5 text-[11.5px] text-suave">
                            {l.ref || 'sem ref.'}
                            {l.linha ? ` · ${l.linha}` : ''}
                            {l.opcoes.length ? ` · ${l.opcoes.length} opções` : ''}
                          </p>
                          {l.duplicado && <p className="mt-0.5 text-[11.5px] font-medium text-alerta">Já existe: {l.duplicado.nome} ({dinheiro(l.duplicado.preco)})</p>}
                          {l.dupNoArquivo && <p className="mt-0.5 text-[11.5px] font-medium text-alerta">Repetido nesta lista</p>}
                          {l.erro && <p className="mt-0.5 text-[11.5px] font-medium text-perigo">{l.erro}</p>}
                        </td>
                        <td className="border-t border-linha py-2.5 text-right align-top text-suave">{l.custo != null ? dinheiro(l.custo) : '—'}</td>
                        <td className="border-t border-linha py-2.5 text-right align-top font-semibold text-tinta">{l.preco != null ? dinheiro(l.preco) : '—'}</td>
                        <td className="border-t border-linha py-2.5 pr-4 text-right align-top sm:pr-3">{l.min}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Passo>
        )}
      </div>

      {r.linhas.length > 0 && (
        <div className="pb-seguro fixed inset-x-0 bottom-16 z-40 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:bottom-0 lg:left-64">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <p className="num min-w-0 flex-1 text-[12.5px] leading-tight text-suave">
              <b className="text-texto">{cont.criar}</b> novos · <b className="text-texto">{cont.atualizar}</b> atualizar · {cont.pular} pular
              {cont.erro ? ` · ${cont.erro} com erro (ficam de fora)` : ''}
            </p>
            <button className="btn-tinta shrink-0" disabled={!cont.criar && !cont.atualizar}>
              <Icone n="check" forte /> <span className="num">Importar {cont.criar + cont.atualizar}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Passo({ n, titulo, dica, children }: { n: number; titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <section className="cartao p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-tinta text-[13px] font-bold text-white">{n}</span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-7 text-tinta">{titulo}</h2>
          {dica && <p className="text-[12.5px] text-suave">{dica}</p>}
        </div>
      </div>
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );
}
function Contador({ cor, n, t }: { cor: string; n: number; t: string }) {
  return (
    <span className={`pilula num px-3 py-1.5 text-[13px] ${cor}`}>
      <b className="text-[15px]">{n}</b> {t}
    </span>
  );
}
