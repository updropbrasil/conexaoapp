'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sb, traduz } from '@/lib/supabase';

export default function Entrar() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [indo, setIndo] = useState(false);
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => data.session && r.replace('/painel/pedidos/'));
  }, [r]);
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIndo(true);
    setErro('');
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: senha });
    setIndo(false);
    if (error) return setErro(traduz(error));
    r.replace('/painel/pedidos/');
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-tinta px-4">
      <form onSubmit={entrar} className="cartao w-full max-w-sm p-6">
        <img src="/marca/logo-completa.webp" alt="Conexão Indústria & Varejo — Direto da fábrica para a sua loja" width={300} height={100} className="mx-auto h-auto w-full max-w-[300px]" />
        <h1 className="mt-5 text-center text-xl font-extrabold text-tinta">Área do representante</h1>
        <p className="mb-5 mt-1 text-center text-sm text-suave">Entre com seu e-mail e senha</p>
        <label className="block"><span className="rotulo">E-mail</span><input className="campo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="mt-3 block"><span className="rotulo">Senha</span><input className="campo" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
        {erro && <p className="mt-3 rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">{erro}</p>}
        <button disabled={indo} className="btn-tinta mt-5 w-full">{indo ? 'Entrando…' : 'Entrar'}</button>
        <Link href="/" className="mt-3 block text-center text-[13px] font-semibold text-suave">Voltar ao catálogo</Link>
      </form>
    </div>
  );
}
