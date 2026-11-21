'use client';
/* Estado do catálogo público: produtos/categorias (Supabase + cache no aparelho), aparência e carrinho de cotação. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { carregarCatalogo, catalogoEmCache } from '@/lib/catalogo';
import { calcular, type ItemCarrinho } from '@/lib/preco';
import { sb, traduz } from '@/lib/supabase';
import { aparenciaEmCache, aplicarTema, carregarAparencia, PADRAO, type Aparencia } from '@/lib/tema';
import type { Fornecedor, Produto } from '@/lib/types';

const CHAVE = 'conexao.cotacao.v2';

interface Ctx {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  carregando: boolean;
  erro: string | null;
  aparencia: Aparencia;
  itens: ItemCarrinho[];
  adicionar: (chave: string, qtd: number) => void;
  definirQtd: (chave: string, qtd: number) => void;
  remover: (chave: string) => void;
  limpar: () => void;
  resumo: ReturnType<typeof calcular>;
  aviso: string | null;
  avisar: (t: string) => void;
  recarregar: () => Promise<void>;
}

const C = createContext<Ctx | null>(null);

export function LojaProvider({ children }: { children: React.ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aparencia, setAparencia] = useState<Aparencia>(PADRAO);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const c = await carregarCatalogo();
      setProdutos(c.produtos);
      setFornecedores(c.fornecedores);
      setErro(null);
    } catch (e) {
      setErro(traduz(e as Error));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // 1) abre na hora com o que estava salvo no aparelho; 2) atualiza pela rede
    const c = catalogoEmCache();
    if (c) {
      setProdutos(c.produtos);
      setFornecedores(c.fornecedores);
      setCarregando(false);
    }
    const ap = aparenciaEmCache();
    setAparencia(ap);
    if (ap.tema !== 'conexao') aplicarTema(ap.tema);
    recarregar();
    carregarAparencia().then(({ ap }) => {
      setAparencia(ap);
      aplicarTema(ap.tema);
    });
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) setItens(JSON.parse(s));
    } catch {}
    sb(); // prepara o cliente (sessão) cedo
  }, [recarregar]);

  // remove do carrinho itens de produtos que deixaram de existir
  useEffect(() => {
    if (!produtos.length || !itens.length) return;
    const valido = (k: string) => {
      const [pid, vid] = k.split('#');
      const p = produtos.find((x) => x.id === pid);
      return !!p && (!vid || p.produto_variacoes.some((v) => v.id === vid));
    };
    if (itens.some((i) => !valido(i.chave))) salvar(itens.filter((i) => valido(i.chave)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos]);

  const salvar = useCallback((n: ItemCarrinho[]) => {
    setItens(n);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(n));
    } catch {}
  }, []);
  const avisar = useCallback((t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 1800);
  }, []);
  const adicionar = useCallback(
    (chave: string, qtd: number) => {
      const ex = itens.find((i) => i.chave === chave);
      salvar(ex ? itens.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + qtd } : i)) : [...itens, { chave, qtd }]);
      avisar('Adicionado à cotação');
    },
    [itens, salvar, avisar],
  );
  const definirQtd = useCallback((chave: string, qtd: number) => salvar(qtd <= 0 ? itens.filter((i) => i.chave !== chave) : itens.map((i) => (i.chave === chave ? { ...i, qtd } : i))), [itens, salvar]);
  const remover = useCallback((chave: string) => salvar(itens.filter((i) => i.chave !== chave)), [itens, salvar]);
  const limpar = useCallback(() => salvar([]), [salvar]);
  const resumo = useMemo(() => calcular(itens, produtos, fornecedores), [itens, produtos, fornecedores]);

  return <C.Provider value={{ produtos, fornecedores, carregando, erro, aparencia, itens, adicionar, definirQtd, remover, limpar, resumo, aviso, avisar, recarregar }}>{children}</C.Provider>;
}

export function useLoja() {
  const c = useContext(C);
  if (!c) throw new Error('useLoja fora do LojaProvider');
  return c;
}
