export const dinheiro = (v: number | null | undefined) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/** Miniatura (300px) gerada no upload junto da foto grande: mesmo caminho com sufixo -300. */
export const miniatura = (url: string | null | undefined) => (url ? url.replace(/(\.\w+)(\?.*)?$/, '-300$1$2') : null);

export const normTxt = (s?: string | null) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Paleta das categorias (fornecedores.cor guarda o índice). */
export const CORES_CATEGORIA = [
  { fundo: '#e8f0f9', texto: '#1b4f8a' },
  { fundo: '#eaf5e4', texto: '#2f6f1f' },
  { fundo: '#fdf0e3', texto: '#a3530f' },
  { fundo: '#f1ecf9', texto: '#5b3a9b' },
  { fundo: '#fbe9ee', texto: '#a3214a' },
  { fundo: '#e6f4f3', texto: '#0f6b66' },
  { fundo: '#f6efe1', texto: '#7a5a14' },
  { fundo: '#e9edf3', texto: '#334155' },
  { fundo: '#fdeceb', texto: '#9f2a1f' },
];
export const corCategoria = (i: number | null | undefined) => CORES_CATEGORIA[(i ?? 0) % CORES_CATEGORIA.length];
