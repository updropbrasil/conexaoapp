'use client';
import { useState } from 'react';
import { miniatura } from '@/lib/formato';

/** Mostra a miniatura (300px); se ela não existir (foto antiga), cai na foto grande. */
export function Mini({ url, alt = '', className = '', eager = false }: { url: string; alt?: string; className?: string; eager?: boolean }) {
  const [src, setSrc] = useState(miniatura(url)!);
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" width={300} height={300} className={className} onError={() => src !== url && setSrc(url)} />;
}
