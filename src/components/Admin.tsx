'use client';
/* Contexto do painel: sessão + catálogo completo (com custo/margem). */
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { sb, traduz } from '@/lib/supabase';
import type { Fornecedor, Produto } from '@/lib/types';
import { useLoja } from './Loja';

interface Ctx {
  email: string;
  produtos: Produto[];
  fornecedores: Fornecedor[];
  recarregar: () => Promise<void>;
  avisar: (t: string) => void;
  falhar: (e: unknown) => void;
}
const C = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  const loja = useLoja();
  const [email, setEmail] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const recarregar = useCallback(async () => {
    try {
      const c = await carregarCatalogo(true);
      setProdutos(c.produtos);
      setFornecedores(c.fornecedores);
    } catch (e) {
      alert(traduz(e as Error));
    }
    loja.recarregar(); // mantém o catálogo público (e o cache) em dia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => {
      if (!data.session) return r.replace('/entrar/');
      setEmail(data.session.user.email ?? '');
      recarregar();
    });
    const { data } = sb().auth.onAuthStateChange((ev) => ev === 'SIGNED_OUT' && r.replace('/entrar/'));
    return () => data.subscription.unsubscribe();
  }, [r, recarregar]);

  if (email === null) return <div className="grid min-h-dvh place-items-center text-suave">Carregando…</div>;
  const falhar = (e: unknown) => alert(traduz(e as Error));
  return <C.Provider value={{ email, produtos, fornecedores, recarregar, avisar: loja.avisar, falhar }}>{children}</C.Provider>;
}

export function useAdmin() {
  const c = useContext(C);
  if (!c) throw new Error('useAdmin fora do AdminProvider');
  return c;
}
