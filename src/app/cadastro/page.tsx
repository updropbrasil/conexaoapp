'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FormCliente } from '@/components/FormCliente';
import { Icone } from '@/components/Icone';
import { TopoSimples } from '@/components/Topo';
import { cadastroPublico } from '@/lib/admin';

export default function Cadastro() {
  const [feito, setFeito] = useState(false);
  return (
    <div className="min-h-dvh pb-10">
      <TopoSimples titulo="Cadastre sua loja" />
      <main className="mx-auto max-w-lg px-4 pt-5">
        {feito ? (
          <div className="grid place-items-center py-14 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-folha-claro text-folha"><Icone n="check" className="size-10" forte /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-tinta">Cadastro recebido!</h2>
            <p className="mt-2 text-suave">Em breve o representante entra em contato pelo WhatsApp.</p>
            <Link href="/" className="btn-tinta mt-8">Ver catálogo</Link>
          </div>
        ) : (
          <div className="cartao p-5">
            <p className="mb-4 text-[14px] text-suave">Com o cadastro, seus dados já ficam com o representante para faturar os pedidos.</p>
            <FormCliente publico botao="Finalizar cadastro" onSalvar={async (d) => { await cadastroPublico(d); setFeito(true); }} />
          </div>
        )}
      </main>
    </div>
  );
}
