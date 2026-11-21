'use client';
import { useEffect, useRef, useState } from 'react';
import { miniatura } from '@/lib/formato';
import { FotoVazia } from './CartaoProduto';
import { Icone } from './Icone';

/** Galeria do produto: deslizar no celular, miniaturas, tela cheia com zoom (toque para ampliar onde tocou). */
export function Galeria({ fotos, nome }: { fotos: string[]; nome: string }) {
  const [i, setI] = useState(0);
  const [cheia, setCheia] = useState(false);
  const trilho = useRef<HTMLDivElement>(null);

  const ir = (n: number) => {
    const k = Math.max(0, Math.min(fotos.length - 1, n));
    setI(k);
    trilho.current?.scrollTo({ left: k * trilho.current.clientWidth, behavior: 'smooth' });
  };

  if (!fotos.length) return <FotoVazia className="aspect-square w-full rounded-[var(--radius-card)]" />;

  return (
    <div>
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-areia-2">
        <div
          ref={trilho}
          className="sem-barra flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            const k = Math.round(el.scrollLeft / el.clientWidth);
            if (k !== i) setI(k);
          }}
        >
          {fotos.map((u, k) => (
            <button key={u} onClick={() => setCheia(true)} className="aspect-square w-full shrink-0 snap-center cursor-zoom-in" aria-label="Ampliar foto">
              <img src={u} alt={`${nome} — foto ${k + 1}`} loading={k === 0 ? 'eager' : 'lazy'} fetchPriority={k === 0 ? 'high' : 'auto'} decoding="async" width={1200} height={1200} className="size-full object-cover" />
            </button>
          ))}
        </div>
        <span className="pilula pointer-events-none absolute right-3 top-3 bg-white/85 text-tinta backdrop-blur">
          <Icone n="zoom" className="size-3.5" /> Ampliar
        </span>
        {fotos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {fotos.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-tinta' : 'w-1.5 bg-tinta/25'}`} />
            ))}
          </div>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="sem-barra mt-2.5 flex gap-2 overflow-x-auto p-0.5">
          {fotos.map((u, k) => (
            <button key={u} onClick={() => ir(k)} className={`size-16 shrink-0 overflow-hidden rounded-xl bg-areia-2 ring-2 transition ${k === i ? 'ring-tinta' : 'ring-transparent opacity-70'}`}>
              <img src={miniatura(u)!} alt="" loading="lazy" width={300} height={300} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {cheia && <TelaCheia fotos={fotos} inicio={i} onFechar={() => setCheia(false)} />}
    </div>
  );
}

function TelaCheia({ fotos, inicio, onFechar }: { fotos: string[]; inicio: number; onFechar: () => void }) {
  const [i, setI] = useState(inicio);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
      if (e.key === 'ArrowRight') setI((v) => Math.min(fotos.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [fotos.length, onFechar]);
  useEffect(() => setZoom(null), [i]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0d10]">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="num px-2 text-sm text-white/70">
          {i + 1} / {fotos.length}
        </span>
        <button onClick={onFechar} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Fechar">
          <Icone n="x" />
        </button>
      </div>
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => {
          if (zoom) return setZoom(null);
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
      >
        <img
          src={fotos[i]}
          alt=""
          className={`size-full object-contain transition-transform duration-300 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          style={zoom ? { transform: 'scale(2.5)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      {fotos.length > 1 && (
        <div className="flex items-center justify-center gap-4 p-4">
          <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} className="grid size-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30" aria-label="Anterior">
            <Icone n="esq" />
          </button>
          <button onClick={() => setI(Math.min(fotos.length - 1, i + 1))} disabled={i === fotos.length - 1} className="grid size-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30" aria-label="Próxima">
            <Icone n="dir" />
          </button>
        </div>
      )}
    </div>
  );
}
