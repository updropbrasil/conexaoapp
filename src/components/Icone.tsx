/* Ícones em traço (estilo Lucide), inline para não depender de pacote/CDN. */
const P: Record<string, string> = {
  busca: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  sacola: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 0 1 6 0',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  esq: 'M15 18l-6-6 6-6',
  dir: 'M9 18l6-6-6-6',
  voltar: 'M19 12H5M12 19l-7-7 7-7',
  foto: 'M4 5h16v14H4zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM20 15l-5-5L4 19',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  lapis: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  caixa: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
  pessoas: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  doc: 'M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6',
  grade: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  sino: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  check: 'M5 12l5 5L20 7',
  zoom: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3M11 8v6M8 11h6',
  etiqueta: 'M3 12V3h9l9 9-9 9-9-9zM7.5 7.5h.01',
  caminhao: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  pontos: 'M5 12h.01M12 12h.01M19 12h.01',
  filtro: 'M4 5h16l-6 8v6l-4-2v-4L4 5z',
  brilho: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  copiar: 'M9 9h11v11H9zM5 15H4V4h11v1',
  alerta: 'M12 3l10 18H2L12 3zM12 10v4M12 17h.01',
  carteira: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2',
  baixa: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  arrastar: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  casa: 'M3 11l9-8 9 8M5 10v10h14V10',
  sair: 'M15 4h4v16h-4M10 17l5-5-5-5M15 12H3',
  telefone: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
};

export function Icone({ n, className = 'size-5', forte = false }: { n: keyof typeof P | string; className?: string; forte?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={forte ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[n] ?? ''} />
    </svg>
  );
}

export function IconeWhats({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
    </svg>
  );
}

/* Emblema da Conexão (mesmo desenho do app atual). */
export function Emblema({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M16 52 A34 34 0 0 1 84 52" fill="none" stroke="#2e86c9" strokeWidth="9" strokeLinecap="round" />
      <path d="M84 48 A34 34 0 0 1 16 48" fill="none" stroke="#57a23a" strokeWidth="9" strokeLinecap="round" />
      <g fill="#6e7174">
        <rect x="25" y="46" width="9" height="15" />
        <polygon points="34,46 34,61 46,61 46,40 40,44 40,40 34,44" />
        <rect x="22" y="58" width="26" height="4" />
      </g>
      <rect x="55" y="48" width="20" height="14" fill="#1b4f8a" />
      <path d="M53 48 L77 48 L74 41 L56 41 Z" fill="#12365f" />
    </svg>
  );
}
