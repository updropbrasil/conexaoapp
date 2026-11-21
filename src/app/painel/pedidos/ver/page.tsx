'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { BuscaProduto } from '@/components/BuscaProduto';
import { Folha } from '@/components/Folha';
import { Icone, IconeWhats } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import * as A from '@/lib/admin';
import { dinheiro, iniciais } from '@/lib/formato';
import { pdfPedido } from '@/lib/pdf';
import { FLUXO, STATUS } from '@/lib/status';
import type { Cliente, Pedido, StatusPedido } from '@/lib/types';
import { soDigitos } from '@/lib/validacao';

export default function Pagina() {
  return (
    <Suspense>
      <Ver />
    </Suspense>
  );
}

const CURTO: Record<string, string> = { aberto: 'Aberto', separacao: 'Separação', faturado: 'Faturado', enviado: 'Enviado', entregue: 'Entregue' };
const dataBr = (s: string | null) => (s ? s.split('-').reverse().join('/') : 'sem data');

function Ver() {
  const id = useSearchParams().get('id')!;
  const router = useRouter();
  const { produtos, fornecedores, avisar, falhar } = useAdmin();
  const [p, setP] = useState<Pedido | null>(null);
  const [cli, setCli] = useState<Cliente | undefined>();
  const [transp, setTransp] = useState('');
  const [add, setAdd] = useState(false);
  const [parc, setParc] = useState({ n: '1', data: A.hojeISO(), int: '30' });

  const carregar = useCallback(async () => {
    try {
      const x = await A.lerPedido(id);
      setP(x);
      setTransp(x.transportadora ?? '');
      A.listarClientes().then((cs) => setCli(cs.find((c) => c.nome.toLowerCase() === x.cliente_nome.toLowerCase())));
    } catch (e) {
      falhar(e);
    }
  }, [id, falhar]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!p) return <PainelTopo titulo="Carregando…" voltar="/painel/pedidos/" />;
  const tot = A.valorPedido(p);
  const com = A.comissaoPedido(p);
  const passo = FLUXO.indexOf(p.status);
  const acao = async (f: () => Promise<unknown>, msg?: string) => {
    try {
      await f();
      if (msg) avisar(msg);
      await carregar();
    } catch (e) {
      falhar(e);
    }
  };
  const whats = () => {
    let t = soDigitos(cli?.tel);
    if (!t) return alert('Este cliente não tem WhatsApp cadastrado.');
    if (t.length <= 11) t = '55' + t;
    let msg = `Olá ${p.cliente_nome}! Segue o pedido ${p.numero} (${p.fornecedor}):\n\n`;
    p.pedido_itens.forEach((i) => (msg += `• ${i.qtd}x ${i.produto_nome} — ${dinheiro(i.preco)}\n`));
    msg += `\n*Total:* ${dinheiro(tot)}`;
    window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      <PainelTopo titulo={`Pedido ${p.numero ?? ''}`} sub={`${new Date(p.criado_em).toLocaleDateString('pt-BR')} · ${p.fornecedor ?? ''}`} voltar="/painel/pedidos/" />
      <div className="mx-auto max-w-5xl px-4 pb-32 pt-4 lg:grid lg:grid-cols-[1fr_340px] lg:gap-5">
        <div className="space-y-4">
          <section className="cartao p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-tinta">Andamento</h2>
              <select aria-label="Status do pedido" value={p.status} onChange={(e) => acao(() => A.mudarStatus(p.id, e.target.value as StatusPedido), 'Status atualizado')} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none ${(STATUS[p.status] ?? STATUS.aberto).cls}`}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.t}</option>
                ))}
              </select>
            </div>
            {p.status === 'cancelado' ? (
              <p className="mt-3 rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">Pedido cancelado — não entra no faturamento nem no financeiro.</p>
            ) : (
              <ol className="mt-4 grid grid-cols-5">
                {FLUXO.map((s, k) => (
                  <li key={s} className="relative flex flex-col items-center text-center">
                    {k > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${k <= passo ? 'bg-folha' : 'bg-linha'}`} />}
                    <button onClick={() => acao(() => A.mudarStatus(p.id, s), 'Status atualizado')} className={`relative grid size-6 place-items-center rounded-full ring-4 ring-white ${k <= passo ? 'bg-folha text-white' : 'bg-areia-2 text-suave'}`} aria-label={STATUS[s].t}>
                      {k <= passo ? <Icone n="check" className="size-3.5" forte /> : <span className="size-1.5 rounded-full bg-current" />}
                    </button>
                    <span className={`mt-1.5 text-[10.5px] font-semibold leading-tight sm:text-[12px] ${k === passo ? 'text-tinta' : 'text-suave'}`}>{CURTO[s]}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="cartao overflow-hidden">
            <header className="flex items-center justify-between border-b border-linha px-4 py-3">
              <h2 className="text-[15px] font-bold text-tinta">Itens</h2>
              <button onClick={() => setAdd(true)} className="btn-claro btn-sm"><Icone n="mais" className="size-4" forte /> Adicionar</button>
            </header>
            <ul className="divide-y divide-linha">
              {p.pedido_itens.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-4 py-3">
                  <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <p className="text-[14px] font-medium leading-snug">{i.produto_nome}</p>
                    <p className="num mt-0.5 text-[12px] text-suave">{i.ref ? `${i.ref} · ` : ''}{dinheiro(i.preco)} / un.</p>
                  </div>
                  <div className="flex shrink-0 items-center rounded-full bg-areia">
                    <button onClick={() => acao(() => A.qtdItemPedido(i.id, i.qtd - 1))} className="grid size-8 place-items-center" aria-label="Diminuir"><Icone n="menos" className="size-3.5" forte /></button>
                    <span className="num min-w-7 text-center text-[13px] font-semibold">{i.qtd}</span>
                    <button onClick={() => acao(() => A.qtdItemPedido(i.id, i.qtd + 1))} className="grid size-8 place-items-center" aria-label="Aumentar"><Icone n="mais" className="size-3.5" forte /></button>
                  </div>
                  <span className="num ml-auto shrink-0 text-right text-[14px] font-bold sm:ml-0 sm:w-[90px]">{dinheiro(i.qtd * i.preco)}</span>
                </li>
              ))}
              {!p.pedido_itens.length && <li className="px-4 py-4 text-sm text-suave">Sem itens.</li>}
            </ul>
            <dl className="num space-y-1.5 border-t border-linha bg-areia/50 px-4 py-3 text-[14px]">
              <div className="flex justify-between"><dt className="font-semibold">Total</dt><dd className="font-display text-[18px] font-extrabold text-tinta">{dinheiro(tot)}</dd></div>
              <div className="flex justify-between text-[#2c6a1c]"><dt>Sua comissão</dt><dd className="font-semibold">{dinheiro(com)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          <section className="cartao p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-marca-claro font-display text-[15px] font-bold text-marca">{iniciais(p.cliente_nome)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{p.cliente_nome}</p>
                <p className="truncate text-[12.5px] text-suave">{cli ? [cli.responsavel, cli.cidade].filter(Boolean).join(' · ') : 'Cliente não cadastrado'}</p>
              </div>
              <button onClick={whats} className="grid size-10 place-items-center rounded-full bg-folha-claro text-folha" aria-label="WhatsApp do cliente"><IconeWhats /></button>
            </div>
            <div className="mt-4">
              <span className="rotulo">Transportadora</span>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-linha">
                <Icone n="caminhao" className="size-5 text-suave" />
                <input value={transp} onChange={(e) => setTransp(e.target.value)} onBlur={() => transp !== (p.transportadora ?? '') && acao(() => A.salvarTransportadora(p.id, transp.trim() || null), 'Transportadora salva')} placeholder="Ex.: Braspress" className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none" />
              </div>
            </div>
          </section>

          <section className="cartao p-4">
            <h2 className="text-[15px] font-bold text-tinta">Parcelas</h2>
            {p.parcelas.length ? (
              <>
                <ul className="mt-2 divide-y divide-linha">
                  {p.parcelas.map((pc) => (
                    <li key={pc.id} className="num flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">{pc.numero}/{pc.total} · {dataBr(pc.vencimento)}</p>
                        <p className="text-[12px] text-[#2c6a1c]">comissão {dinheiro(pc.comissao)}</p>
                      </div>
                      <b className="text-[14px]">{dinheiro(pc.valor)}</b>
                      {pc.recebido ? (
                        <button onClick={() => acao(() => A.marcarRecebido('parcelas', pc.id, false))} className="pilula bg-folha-claro text-[#2c6a1c]"><Icone n="check" className="size-3" forte /> Pago</button>
                      ) : (
                        <button onClick={() => acao(() => A.marcarRecebido('parcelas', pc.id, true), 'Parcela recebida')} className="btn-folha btn-sm px-3 py-1.5">Receber</button>
                      )}
                    </li>
                  ))}
                </ul>
                <button onClick={() => confirm('Refazer as parcelas? As atuais serão apagadas.') && acao(() => A.refazerParcelas(p.id))} className="btn-claro btn-sm mt-3">↺ Refazer parcelamento</button>
              </>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label><span className="rotulo">Parcelas</span><input className="campo num px-3" inputMode="numeric" value={parc.n} onChange={(e) => setParc({ ...parc, n: e.target.value.replace(/\D/g, '') })} /></label>
                  <label><span className="rotulo">1º venc.</span><input type="date" className="campo num px-2 text-[13px]" value={parc.data} onChange={(e) => setParc({ ...parc, data: e.target.value })} /></label>
                  <label><span className="rotulo">A cada (dias)</span><input className="campo num px-3" inputMode="numeric" value={parc.int} onChange={(e) => setParc({ ...parc, int: e.target.value.replace(/\D/g, '') })} /></label>
                </div>
                <p className="num mt-2 text-[12px] text-suave">Valor ({dinheiro(tot)}) e comissão ({dinheiro(com)}) divididos entre as parcelas.</p>
                <button onClick={() => acao(() => A.gerarParcelas(p, Math.max(1, +parc.n || 1), parc.data, Math.max(1, +parc.int || 30)), 'Parcelas geradas')} className="btn-tinta btn-sm mt-3 w-full">Gerar parcelas</button>
              </>
            )}
          </section>
        </div>
      </div>

      <div className="pb-seguro fixed inset-x-0 bottom-16 z-40 border-t border-linha bg-white/95 px-4 pt-3 backdrop-blur-md lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-5xl gap-2">
          <button onClick={() => confirm(`Excluir o pedido ${p.numero}? As parcelas também serão apagadas.`) && A.excluirPedido(p.id).then(() => (avisar('Pedido excluído'), router.replace('/painel/pedidos/'))).catch(falhar)} className="btn-claro px-4 text-perigo" aria-label="Excluir pedido"><Icone n="lixo" /></button>
          <button onClick={() => pdfPedido(p, cli).catch(falhar)} className="btn-claro flex-1"><Icone n="doc" /> PDF</button>
          <button onClick={whats} className="btn-folha flex-1"><IconeWhats /> Enviar</button>
        </div>
      </div>
      <Folha titulo="Adicionar produto" aberta={add} onFechar={() => setAdd(false)}>
        <BuscaProduto produtos={produtos} fornecedores={fornecedores} onEscolher={(i) => acao(() => A.addItemPedido(p.id, { ...i, fornecedor: p.fornecedor ?? i.fornecedor }), 'Item adicionado').then(() => setAdd(false))} />
      </Folha>
    </>
  );
}
