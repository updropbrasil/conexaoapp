/*
 * Fotos leves: comprime NO NAVEGADOR antes de enviar.
 *  - grande: lado maior 1200 px, WebP 0,8  → página do produto
 *  - miniatura: lado menor 300 px, WebP 0,72 → listas e grades
 * Caminho no bucket: produtos/<produtoId>/<n>.webp e <n>-300.webp (n = carimbo de tempo → nome novo a cada envio,
 * por isso o cache pode ser de 1 ano sem risco de foto velha).
 */
import { BUCKET, CACHE_FOTO } from './config';
import { sb } from './supabase';

export const GRANDE = { lado: 1200, q: 0.8 };
export const MINI = { lado: 300, q: 0.72 };

export interface Comprimida { blob: Blob; ext: 'webp' | 'jpg'; largura: number; altura: number }

async function bitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' }); // respeita a rotação das fotos de celular
    } catch {}
  }
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => (URL.revokeObjectURL(u), res(i));
    i.onerror = (e) => (URL.revokeObjectURL(u), rej(e));
    i.src = u;
  });
}

const paraBlob = (c: HTMLCanvasElement, tipo: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, tipo, q));

/** modo "maior": lado maior = lado; modo "menor": lado menor = lado (miniatura nítida no recorte quadrado). */
export async function comprimir(file: Blob, lado: number, q: number, modo: 'maior' | 'menor' = 'maior'): Promise<Comprimida> {
  const img = await bitmap(file);
  const w0 = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const h0 = 'naturalHeight' in img ? img.naturalHeight : img.height;
  const ref = modo === 'maior' ? Math.max(w0, h0) : Math.min(w0, h0);
  const k = Math.min(1, lado / ref);
  const w = Math.max(1, Math.round(w0 * k));
  const h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; // PNG transparente vira fundo branco
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
  if ('close' in img) img.close();
  const webp = await paraBlob(c, 'image/webp', q);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', largura: w, altura: h };
  const jpg = await paraBlob(c, 'image/jpeg', q); // navegadores sem WebP
  if (!jpg) throw new Error('Não foi possível processar a imagem.');
  return { blob: jpg, ext: 'jpg', largura: w, altura: h };
}

export const urlPublica = (caminho: string) => sb().storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;

/** Caminho no bucket a partir da URL pública (para apagar). */
export function caminhoDaUrl(url: string): string | null {
  const m = url.split('?')[0].match(/\/object\/public\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export interface Enviada { url: string; bytesOriginal: number; bytesGrande: number; bytesMini: number }

/** Comprime e envia uma foto do produto (grande + miniatura). Devolve a URL pública da grande. */
export async function enviarFoto(produtoId: string, file: Blob, pasta = produtoId): Promise<Enviada> {
  const [g, m] = await Promise.all([comprimir(file, GRANDE.lado, GRANDE.q), comprimir(file, MINI.lado, MINI.q, 'menor')]);
  const n = Date.now().toString() + Math.floor(Math.random() * 90 + 10);
  const base = `${pasta}/${n}`;
  const st = sb().storage.from(BUCKET);
  const up1 = await st.upload(`${base}.${g.ext}`, g.blob, { cacheControl: CACHE_FOTO, contentType: g.blob.type, upsert: false });
  if (up1.error) throw new Error('Erro ao enviar foto: ' + up1.error.message);
  const up2 = await st.upload(`${base}-300.${m.ext}`, m.blob, { cacheControl: CACHE_FOTO, contentType: m.blob.type, upsert: false });
  if (up2.error) throw new Error('Erro ao enviar miniatura: ' + up2.error.message);
  return { url: urlPublica(`${base}.${g.ext}`), bytesOriginal: file.size, bytesGrande: g.blob.size, bytesMini: m.blob.size };
}

/** Apaga a foto e a miniatura do Storage. Sem a policy de DELETE (migração 001) o Storage ignora — não quebra o app. */
export async function apagarArquivos(urls: string[]) {
  const caminhos = urls.flatMap((u) => {
    const c = caminhoDaUrl(u);
    return c ? [c, c.replace(/(\.\w+)$/, '-300$1')] : [];
  });
  if (caminhos.length) await sb().storage.from(BUCKET).remove(caminhos).catch(() => {});
}
