'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function Painel() {
  const r = useRouter();
  useEffect(() => r.replace('/painel/pedidos/'), [r]);
  return null;
}
