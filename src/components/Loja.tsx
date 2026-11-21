'use client';
/* Estado do catálogo público: produtos/categorias + carrinho de cotação (salvo no aparelho). */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fornecedores as mockForn, produtos as mockProd } from '@/lib/mock/dados';
import { calcular, type ItemCarrinho } from '@/lib/preco';
import type { Fornecedor, Produto } from '@/lib/types';

const CHAVE = 'conexao.cotacao.v2';

interface Ctx {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  itens: ItemCarrinho[];
  adicionar: (chave: string, qtd: number) => void;
  definirQtd: (chave: string, qtd: number) => void;
  remover: (chave: string) => void;
  limpar: () => void;
  resumo: ReturnType<typeof calcular>;
  aviso: string | null;
}

const C = createContext<Ctx | null>(null);

export function LojaProvider({ children }: { children: React.ReactNode }) {
  // Fase 1: dados de exemplo. Fase 2: troca por leitura pública do Supabase (com cache local).
  const [produtos] = useState<Produto[]>(mockProd);
  const [fornecedores] = useState<Fornecedor[]>(mockForn);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) setItens(JSON.parse(s));
    } catch {}
  }, []);
  const salvar = useCallback((n: ItemCarrinho[]) => {
    setItens(n);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(n));
    } catch {}
  }, []);

  const adicionar = useCallback(
    (chave: string, qtd: number) => {
      const ex = itens.find((i) => i.chave === chave);
      salvar(ex ? itens.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + qtd } : i)) : [...itens, { chave, qtd }]);
      setAviso('Adicionado à cotação');
      setTimeout(() => setAviso(null), 1800);
    },
    [itens, salvar],
  );
  const definirQtd = useCallback((chave: string, qtd: number) => salvar(qtd <= 0 ? itens.filter((i) => i.chave !== chave) : itens.map((i) => (i.chave === chave ? { ...i, qtd } : i))), [itens, salvar]);
  const remover = useCallback((chave: string) => salvar(itens.filter((i) => i.chave !== chave)), [itens, salvar]);
  const limpar = useCallback(() => salvar([]), [salvar]);
  const resumo = useMemo(() => calcular(itens, produtos, fornecedores), [itens, produtos, fornecedores]);

  return <C.Provider value={{ produtos, fornecedores, itens, adicionar, definirQtd, remover, limpar, resumo, aviso }}>{children}</C.Provider>;
}

export function useLoja() {
  const c = useContext(C);
  if (!c) throw new Error('useLoja fora do LojaProvider');
  return c;
}
