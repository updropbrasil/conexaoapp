'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { Folha } from '@/components/Folha';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import * as A from '@/lib/admin';
import { dinheiro, mesAno, normTxt } from '@/lib/formato';
import type { Cliente, Lancamento, Pedido } from '@/lib/types';

const ymd = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const curto = (v: number) => (v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : Math.round(v).toString());

export default function Financeiro() {
  const { avisar, falhar } = useAdmin();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [lancs, setLancs] = useState<Lancamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ref, setRef] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dia, setDia] = useState<string>(ymd(new Date()));
  const [novo, setNovo] = useState(false);
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [p, l, c] = await Promise.all([A.listarPedidos(), A.listarLancamentos(), A.listarClientes()]);
      setPedidos(p);
      setLancs(l);
      setClientes(c);
      setCarregado(true);
    } catch (e) {
      falhar(e);
    }
  }, [falhar]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const recs = useMemo(() => A.recebiveis(pedidos, lancs), [pedidos, lancs]);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const ini = ymd(new Date(y, m, 1));
  const fim = ymd(new Date(y, m + 1, 0));
  const noMes = recs.filter((r) => r.data && r.data >= ini && r.data <= fim);
  const aReceber = noMes.filter((r) => !r.recebido).reduce((a, r) => a + r.valor, 0);
  const recebido = noMes.filter((r) => r.recebido).reduce((a, r) => a + r.valor, 0);
  const comissao = noMes.reduce((a, r) => a + r.comissao, 0);
  const hoje = new Date();
  const dow = (hoje.getDay() + 6) % 7;
  const sIni = ymd(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow));
  const sFim = ymd(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow + 6));
  const semana = recs.filter((r) => r.data && r.data >= sIni && r.data <= sFim && !r.recebido).reduce((a, r) => a + r.valor, 0);
  const porDia = useMemo(() => {
    const o: Record<string, A.Recebivel[]> = {};
    recs.forEach((r) => r.data && (o[r.data] = [...(o[r.data] ?? []), r]));
    return o;
  }, [recs]);
  const inicioSemana = (new Date(y, m, 1).getDay() + 6) % 7;
  const dias = new Date(y, m + 1, 0).getDate();
  const hojeS = ymd(new Date());
  const doDia = porDia[dia] ?? [];

  const acao = async (f: () => Promise<unknown>, msg?: string) => {
    try {
      await f();
      if (msg) avisar(msg);
      await carregar();
    } catch (e) {
      falhar(e);
    }
  };
  const docDe = (nome: string) => clientes.find((c) => c.nome.toLowerCase() === nome.toLowerCase())?.doc || '—';

  return (
    <>
      <PainelTopo titulo="Financeiro" acoes={<button onClick={() => setNovo(true)} className="btn-folha btn-sm h-10"><Icone n="mais" className="size-4" forte /> Recebimento</button>} />
      <div className="mx-auto max-w-5xl px-4 pt-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-between rounded-2xl bg-white p-1.5 ring-1 ring-linha">
            <button onClick={() => setRef(new Date(y, m - 1, 1))} className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia" aria-label="Mês anterior"><Icone n="esq" /></button>
            <b className="text-[15px] font-semibold text-tinta">{mesAno(ref)}</b>
            <button onClick={() => setRef(new Date(y, m + 1, 1))} className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia" aria-label="Próximo mês"><Icone n="dir" /></button>
          </div>
          <button onClick={() => window.print()} className="btn-claro h-12 shrink-0 rounded-2xl px-3.5" aria-label="Imprimir relatório"><Icone n="doc" /> <span className="hidden sm:inline">Relatório</span></button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Stat t="A receber no mês" v={aReceber} cor="text-alerta" />
          <Stat t="Recebido no mês" v={recebido} cor="text-folha" />
          <Stat t="Sua comissão no mês" v={comissao} cor="text-tinta" />
          <Stat t="A receber esta semana" v={semana} cor="text-tinta" />
        </div>

        <div className="cartao mt-4 p-2.5 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-suave">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: inicioSemana }, (_, k) => <div key={'v' + k} />)}
            {Array.from({ length: dias }, (_, k) => {
              const ds = ymd(new Date(y, m, k + 1));
              const its = porDia[ds] ?? [];
              const aR = its.filter((x) => !x.recebido).reduce((a, x) => a + x.valor, 0);
              const rc = its.filter((x) => x.recebido).reduce((a, x) => a + x.valor, 0);
              return (
                <button key={ds} onClick={() => setDia(ds)} className={`flex min-h-[62px] flex-col items-stretch rounded-xl p-1 text-left ring-1 transition sm:min-h-[78px] sm:p-1.5 ${dia === ds ? 'bg-marca-claro ring-marca' : its.length ? 'bg-white ring-linha' : 'ring-transparent hover:bg-white'}`}>
                  <span className={`num text-[13px] font-semibold ${ds === hojeS ? 'grid size-6 place-items-center rounded-full bg-tinta text-white' : ''}`}>{k + 1}</span>
                  {aR > 0 && <span className="num mt-auto truncate rounded-md bg-[#fff1cc] px-1 text-[10.5px] font-bold text-[#8a5a00]">{curto(aR)}</span>}
                  {rc > 0 && <span className={`num truncate rounded-md bg-folha-claro px-1 text-[10.5px] font-bold text-[#2c6a1c] ${aR > 0 ? 'mt-0.5' : 'mt-auto'}`}>{curto(rc)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[16px] font-bold capitalize text-tinta">{new Date(dia + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</h2>
          </div>
          {!carregado ? (
            <p className="py-6 text-center text-suave">Carregando…</p>
          ) : !doDia.length ? (
            <p className="cartao px-4 py-6 text-center text-[14px] text-suave">Nada neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {doDia.map((r) => (
                <li key={r.id} className={`cartao flex items-center gap-3 border-l-[5px] p-3.5 ${r.recebido ? 'border-folha' : 'border-[#e0a100]'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold">{r.cliente} <span className="text-[12px] font-normal text-suave">{r.titulo}</span></p>
                    <p className="truncate text-[12px] text-suave">{r.sub || '—'}</p>
                  </div>
                  <div className="num shrink-0 text-right">
                    <p className="text-[14.5px] font-bold">{dinheiro(r.valor)}</p>
                    {r.comissao ? <p className="text-[11.5px] text-[#2c6a1c]">com. {dinheiro(r.comissao)}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => acao(() => A.marcarRecebido(r.tipo === 'avulso' ? 'lancamentos' : 'parcelas', r.id, !r.recebido), r.recebido ? undefined : 'Recebido!')} className={r.recebido ? 'btn-claro btn-sm px-3 py-1.5' : 'btn-folha btn-sm px-3 py-1.5'}>{r.recebido ? 'Desfazer' : 'Recebido'}</button>
                    {r.tipo === 'parcela' ? (
                      <Link href={`/painel/pedidos/ver/?id=${r.pedido_id}`} className="text-center text-[11.5px] font-semibold text-marca">ver pedido</Link>
                    ) : (
                      <button onClick={() => confirm('Excluir este recebimento?') && acao(() => A.excluirLancamento(r.id))} className="text-[11.5px] font-semibold text-perigo">excluir</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Relatório para imprimir */}
      <div className="hidden p-8 text-[12px] text-black print:block">
        <h1 className="text-[18px] font-bold">CONEXÃO · Relatório de recebimentos</h1>
        <p className="mb-3">{mesAno(ref)}</p>
        <table className="w-full border-collapse">
          <thead><tr className="border-b text-left"><th>Cliente</th><th>CPF/CNPJ</th><th>Vencimento</th><th className="text-right">Valor</th><th className="text-right">Comissão</th><th>Status</th></tr></thead>
          <tbody>
            {[...noMes].sort((a, b) => (a.data! < b.data! ? -1 : 1)).map((r) => (
              <tr key={r.id} className="border-b"><td>{r.cliente}</td><td>{docDe(r.cliente)}</td><td>{r.data!.split('-').reverse().join('/')}</td><td className="text-right">{dinheiro(r.valor)}</td><td className="text-right">{dinheiro(r.comissao)}</td><td>{r.recebido ? 'Recebido' : 'A receber'}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right font-bold">Total: {dinheiro(noMes.reduce((a, r) => a + r.valor, 0))} · Comissão: {dinheiro(comissao)}</p>
      </div>

      <NovoRecebimento aberto={novo} dia={dia} clientes={clientes} pedidos={pedidos} onFechar={() => setNovo(false)} onSalvo={() => acao(async () => setNovo(false), 'Recebimento salvo')} />
    </>
  );
}

function Stat({ t, v, cor }: { t: string; v: number; cor: string }) {
  return (
    <div className="cartao p-3.5">
      <p className="text-[12px] leading-tight text-suave">{t}</p>
      <p className={`num font-display mt-1 text-[19px] font-extrabold ${cor}`}>{dinheiro(v)}</p>
    </div>
  );
}

function NovoRecebimento({ aberto, dia, clientes, pedidos, onFechar, onSalvo }: { aberto: boolean; dia: string; clientes: Cliente[]; pedidos: Pedido[]; onFechar: () => void; onSalvo: () => void }) {
  const [cli, setCli] = useState('');
  const [ped, setPed] = useState('');
  const [valor, setValor] = useState('');
  const [com, setCom] = useState('');
  const [venc, setVenc] = useState(dia);
  const [desc, setDesc] = useState('');
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (aberto) {
      setCli(''); setPed(''); setValor(''); setCom(''); setDesc(''); setErro(''); setVenc(dia);
    }
  }, [aberto, dia]);
  const dosCli = pedidos.filter((p) => cli && p.cliente_nome.toLowerCase() === cli.toLowerCase());
  const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'));
  const salvar = async () => {
    const v = num(valor);
    if (isNaN(v)) return setErro('Informe o valor.');
    try {
      await A.novoLancamento({ descricao: desc.trim() || null, cliente_nome: cli.trim() || null, pedido_numero: pedidos.find((p) => p.id === ped)?.numero ?? null, valor: v, comissao: num(com) || 0, vencimento: venc || null });
      onSalvo();
    } catch (e) {
      setErro((e as Error).message);
    }
  };
  return (
    <Folha titulo="Novo recebimento" aberta={aberto} onFechar={onFechar} rodape={<button onClick={salvar} className="btn-folha w-full">Salvar recebimento</button>}>
      <div className="space-y-3">
        <label className="block"><span className="rotulo">Cliente (opcional)</span>
          <input className="campo" list="clientes-fin" value={cli} onChange={(e) => { setCli(e.target.value); setPed(''); }} placeholder="Buscar cliente" />
          <datalist id="clientes-fin">{clientes.filter((c) => !cli || normTxt(c.nome).includes(normTxt(cli))).slice(0, 30).map((c) => <option key={c.id} value={c.nome} />)}</datalist>
        </label>
        {dosCli.length > 0 && (
          <label className="block"><span className="rotulo">Pedido (opcional)</span>
            <select className="campo" value={ped} onChange={(e) => { setPed(e.target.value); const p = pedidos.find((x) => x.id === e.target.value); if (p) { setValor(A.valorPedido(p).toFixed(2).replace('.', ',')); setCom(A.comissaoPedido(p).toFixed(2).replace('.', ',')); } }}>
              <option value="">— sem pedido específico —</option>
              {dosCli.map((p) => <option key={p.id} value={p.id}>{p.numero} · {p.fornecedor} · {dinheiro(A.valorPedido(p))}</option>)}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="rotulo">Valor (R$)</span><input className="campo num" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} /></label>
          <label className="block"><span className="rotulo">Comissão (R$)</span><input className="campo num" inputMode="decimal" value={com} onChange={(e) => setCom(e.target.value)} /></label>
        </div>
        <label className="block"><span className="rotulo">Vencimento</span><input type="date" className="campo" value={venc} onChange={(e) => setVenc(e.target.value)} /></label>
        <label className="block"><span className="rotulo">Observação</span><input className="campo" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: comissão avulsa, acerto…" /></label>
        {erro && <p className="rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">{erro}</p>}
      </div>
    </Folha>
  );
}
