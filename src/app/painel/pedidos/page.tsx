'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { BuscaProduto } from '@/components/BuscaProduto';
import { Folha } from '@/components/Folha';
import { Icone } from '@/components/Icone';
import { PainelTopo } from '@/components/PainelTopo';
import { comissaoPedido, criarPedidos, listarClientes, listarPedidos, unidadesPedido, valorPedido, type ItemNovo } from '@/lib/admin';
import { dataCurta, dinheiro, mesAno, normTxt } from '@/lib/formato';
import { STATUS } from '@/lib/status';
import type { Cliente, Pedido, StatusPedido } from '@/lib/types';

export default function Pedidos() {
  const { falhar } = useAdmin();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState<StatusPedido | ''>('');
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [todos, setTodos] = useState(false);
  const [novo, setNovo] = useState(false);

  const carregar = useCallback(() => listarPedidos().then(setPedidos).catch(falhar), [falhar]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const doMes = useMemo(
    () => (pedidos ?? []).filter((p) => todos || (new Date(p.criado_em).getFullYear() === mes.getFullYear() && new Date(p.criado_em).getMonth() === mes.getMonth())),
    [pedidos, mes, todos],
  );
  const validos = doMes.filter((p) => p.status !== 'cancelado');
  const fat = validos.reduce((a, p) => a + valorPedido(p), 0);
  const com = validos.reduce((a, p) => a + comissaoPedido(p), 0);
  const andamento = doMes.filter((p) => ['aberto', 'separacao'].includes(p.status)).length;
  const lista = doMes.filter((p) => !filtro || p.status === filtro);
  const rotuloMes = mesAno(mes);

  return (
    <>
      <PainelTopo
        titulo="Pedidos"
        acoes={
          <button onClick={() => setNovo(true)} className="btn-tinta btn-sm h-10">
            <Icone n="mais" className="size-4" forte /> Novo
          </button>
        }
      />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-between rounded-2xl bg-white p-1.5 ring-1 ring-linha">
            <button disabled={todos} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia disabled:opacity-30" aria-label="Mês anterior"><Icone n="esq" /></button>
            <b className="text-[15px] font-semibold text-tinta">{todos ? 'Todos os meses' : rotuloMes}</b>
            <button disabled={todos} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-xl text-suave hover:bg-areia disabled:opacity-30" aria-label="Próximo mês"><Icone n="dir" /></button>
          </div>
          <button onClick={() => setTodos(!todos)} className={`h-12 shrink-0 rounded-2xl px-3.5 text-[13px] font-semibold ring-1 ${todos ? 'bg-tinta text-white ring-tinta' : 'bg-white text-suave ring-linha'}`}>Ver todos</button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2 rounded-[var(--radius-card)] bg-tinta p-4 text-white lg:col-span-2">
            <p className="text-[12.5px] text-white/65">Faturamento {todos ? 'total' : 'do mês'}</p>
            <p className="num font-display mt-0.5 text-[28px] font-extrabold leading-tight">{dinheiro(fat)}</p>
            <p className="num mt-1 text-[12.5px] text-[#9fd38a]">Sua comissão: {dinheiro(com)}</p>
          </div>
          <div className="cartao p-4">
            <p className="text-[12.5px] text-suave">Pedidos</p>
            <p className="num font-display text-[26px] font-extrabold text-tinta">{doMes.length}</p>
          </div>
          <div className="cartao p-4">
            <p className="text-[12.5px] text-suave">Em andamento</p>
            <p className="num font-display text-[26px] font-extrabold text-alerta">{andamento}</p>
          </div>
        </div>

        <div className="sem-barra -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {(['', 'aberto', 'separacao', 'faturado', 'enviado', 'entregue', 'cancelado'] as const).map((s) => (
            <button key={s || 'todos'} onClick={() => setFiltro(s)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${filtro === s ? 'bg-tinta text-white' : 'bg-white text-suave ring-1 ring-linha'}`}>
              {s ? STATUS[s].t : 'Todos'}
            </button>
          ))}
        </div>

        {pedidos === null ? (
          <p className="py-10 text-center text-suave">Carregando…</p>
        ) : !lista.length ? (
          <div className="cartao mt-3 grid place-items-center gap-1 px-6 py-12 text-center">
            <Icone n="caixa" className="size-8 text-suave/60" />
            <p className="font-semibold text-tinta">Nenhum pedido {todos ? 'ainda' : 'neste mês'}</p>
            <p className="text-sm text-suave">Os pedidos nascem das cotações ou do botão “Novo”.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {lista.map((p) => {
              const s = STATUS[p.status] ?? STATUS.aberto;
              return (
                <li key={p.id}>
                  <Link href={`/painel/pedidos/ver/?id=${p.id}`} className="cartao flex items-center gap-3 p-3.5 transition hover:shadow-md sm:p-4">
                    <span className="num grid size-12 shrink-0 place-items-center rounded-2xl bg-areia text-[13px] font-bold text-tinta">{(p.numero ?? '').replace('#', '')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{p.cliente_nome}</p>
                      <p className="num truncate text-[12.5px] text-suave">
                        {p.fornecedor} · {unidadesPedido(p)} un. · {dataCurta(p.criado_em)}
                      </p>
                      <span className={`pilula mt-1.5 ${s.cls}`}>
                        <span className="size-1.5 rounded-full" style={{ background: s.ponto }} /> {s.t}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`num font-display text-[16px] font-bold ${p.status === 'cancelado' ? 'text-suave line-through' : 'text-tinta'}`}>{dinheiro(valorPedido(p))}</p>
                      <Icone n="dir" className="ml-auto mt-1 size-4 text-suave" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <NovoPedido aberto={novo} onFechar={() => setNovo(false)} onCriado={carregar} />
    </>
  );
}

function NovoPedido({ aberto, onFechar, onCriado }: { aberto: boolean; onFechar: () => void; onCriado: () => void }) {
  const { produtos, fornecedores, avisar, falhar } = useAdmin();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cli, setCli] = useState('');
  const [itens, setItens] = useState<ItemNovo[]>([]);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (aberto) {
      listarClientes().then(setClientes).catch(() => {});
      setItens([]);
      setCli('');
    }
  }, [aberto]);
  const sugestoes = cli && !clientes.some((c) => c.nome === cli) ? clientes.filter((c) => normTxt(c.nome).includes(normTxt(cli))).slice(0, 5) : [];
  const total = itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  const criar = async () => {
    if (!cli.trim()) return alert('Escolha ou digite o cliente.');
    if (!itens.length) return alert('Adicione pelo menos um produto.');
    setSalvando(true);
    try {
      const nums = await criarPedidos(cli.trim(), itens);
      avisar(`Pedido ${nums.join(', ')} criado`);
      onFechar();
      onCriado();
      if (nums.length === 1) router.refresh();
    } catch (e) {
      falhar(e);
    } finally {
      setSalvando(false);
    }
  };
  return (
    <Folha
      titulo="Novo pedido"
      aberta={aberto}
      onFechar={onFechar}
      larga
      rodape={
        <div className="flex items-center gap-3">
          <span className="num flex-1 text-[14px]">Total <b className="font-display text-[18px] text-tinta">{dinheiro(total)}</b></span>
          <button onClick={criar} disabled={salvando} className="btn-folha">{salvando ? 'Criando…' : 'Criar pedido'}</button>
        </div>
      }
    >
      <span className="rotulo">Cliente</span>
      <input className="campo" value={cli} onChange={(e) => setCli(e.target.value)} placeholder="Digite o nome da loja" />
      {sugestoes.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {sugestoes.map((c) => (
            <button key={c.id} onClick={() => setCli(c.nome)} className="block w-full rounded-xl bg-white px-3 py-2 text-left text-[14px] ring-1 ring-linha">
              <b className="font-semibold">{c.nome}</b> <span className="text-suave">· {c.cidade}</span>
            </button>
          ))}
        </div>
      )}
      <p className="rotulo mt-4">Adicionar produtos</p>
      <BuscaProduto produtos={produtos} fornecedores={fornecedores} onEscolher={(i) => setItens((a) => { const ex = a.find((x) => x.produto_nome === i.produto_nome); return ex ? a.map((x) => (x === ex ? { ...x, qtd: x.qtd + i.qtd } : x)) : [...a, i]; })} />
      <p className="rotulo mt-4">Itens ({itens.length}) — um pedido por categoria</p>
      <ul className="divide-y divide-linha rounded-2xl bg-white ring-1 ring-linha">
        {itens.map((i, k) => (
          <li key={k} className="flex items-center gap-2 px-3 py-2.5 text-[13.5px]">
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{i.produto_nome}</span><span className="text-[11.5px] text-suave">{i.fornecedor}</span></span>
            <input className="campo num w-16 px-2 py-1.5 text-center" inputMode="numeric" value={i.qtd} onChange={(e) => setItens(itens.map((x, j) => (j === k ? { ...x, qtd: Math.max(1, parseInt(e.target.value) || 1) } : x)))} />
            <b className="num w-20 text-right">{dinheiro(i.qtd * i.preco)}</b>
            <button onClick={() => setItens(itens.filter((_, j) => j !== k))} className="text-perigo" aria-label="Remover"><Icone n="lixo" className="size-4" /></button>
          </li>
        ))}
        {!itens.length && <li className="px-3 py-3 text-[13px] text-suave">Nenhum item ainda.</li>}
      </ul>
    </Folha>
  );
}
