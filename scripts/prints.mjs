// Tira os prints das telas (modo de teste). Uso: npm run build && node scripts/prints.mjs [pasta-saida]
// Precisa do Playwright instalado (global ou local) e serve a pasta out/ numa porta local.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const req = createRequire(import.meta.url);
let pw;
try {
  pw = req('playwright');
} catch {
  pw = createRequire('/opt/npm-tools/node_modules/')('playwright');
}
const SAIDA = process.argv[2] || join(process.cwd(), 'prints');
mkdirSync(SAIDA, { recursive: true });
const PORTA = 4173;
const BASE = `http://127.0.0.1:${PORTA}`;
const srv = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], { cwd: join(process.cwd(), 'out'), stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));

const CARRINHO = [
  { chave: 'cob-estampado-casal', qtd: 80 },
  { chave: 'travesseiro-sublime', qtd: 30 },
  { chave: 'cob-canelado-casal', qtd: 40 },
  { chave: 'short-fitness#short-fitness-v1', qtd: 30 },
  { chave: 'conjunto-dryfit#conjunto-dryfit-v2', qtd: 30 },
];

const IMPORT = JSON.stringify(
  [
    { nome: 'Cobertor Microfibra Canelado Casal 1,80x2,00', ref: 'COB-CAN-CAS', linha: 'Cobertores', custo: 14.9, min: 40 },
    { nome: 'Cobertor Microfibra Canelado Queen 2,20x2,40', ref: 'COB-CAN-QUE', linha: 'Cobertores', custo: 19.8, min: 40 },
    { nome: 'Edredom Dupla Face Casal 2,20x2,40', ref: 'EDR-DF-CAS', linha: 'Edredons', custo: 42.5, min: 10 },
    { nome: 'Edredom Dupla Face Solteiro 1,60x2,40', ref: 'EDR-DF-SOL', linha: 'Edredons', custo: 33.9, min: 10 },
    { nome: 'Travesseiro Sublime 70x50', ref: '', linha: 'Travesseiros', custo: 12.1, min: 30 },
    { nome: 'Jogo de Toalha Banho + Rosto Felpuda', ref: 'TOA-JG-2P', linha: 'Toalhas', custo: 18.4, min: 24, variacoes: [{ nome: 'Branco', ref: 'TOA-JG-BR', custo: 18.4 }, { nome: 'Areia', ref: 'TOA-JG-AR', custo: 18.4 }] },
    { nome: 'Toalha de Rosto Felpuda 48x80', ref: 'TOA-ROS-48', linha: 'Toalhas', custo: 6.2, min: 48 },
    { nome: 'Toalha de Rosto Felpuda 48x80', ref: 'TOA-ROS-48', linha: 'Toalhas', custo: 6.2, min: 48 },
    { nome: 'Kit Lençol Casal 4 Peças Percal 180 fios', ref: 'LEN-KIT-PER', linha: 'Lençóis', custo: null, min: 12 },
  ],
  null,
  2,
);

const b = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const celular = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR' };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'pt-BR' };

async function tela(ctxOpt, url, arquivo, { cheio = false, antes, carrinho = false, altura } = {}) {
  const ctx = await b.newContext(ctxOpt);
  if (carrinho) await ctx.addInitScript((c) => localStorage.setItem('conexao.cotacao.v2', JSON.stringify(c)), CARRINHO);
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (cheio) {
    // rola a página para carregar as fotos com loading="lazy"
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForLoadState('networkidle');
  }
  if (antes) await antes(p);
  await p.waitForTimeout(400);
  const w = ctxOpt.viewport.width;
  if (cheio) {
    // aumenta a "tela" até o tamanho da página: barras fixas no rodapé ficam no rodapé de verdade
    const alto = altura ?? (await p.evaluate(() => document.documentElement.scrollHeight));
    await p.setViewportSize({ width: w, height: alto });
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: join(SAIDA, arquivo) });
  console.log('ok', arquivo);
  await ctx.close();
}

await tela(celular, '/', '01-catalogo.png', { cheio: true, altura: 2400 });
await tela(desktop, '/', '01-catalogo-desktop.png', { cheio: true, altura: 1700 });
await tela(celular, '/', '01b-catalogo-categoria.png', { antes: (p) => p.getByRole('button', { name: /Esporte Fitness/ }).click() });
await tela(celular, '/produto/?id=cob-estampado-casal', '02-produto.png', { cheio: true });
await tela(desktop, '/produto/?id=cob-estampado-casal', '02-produto-desktop.png');
await tela(celular, '/produto/?id=short-fitness', '02b-produto-variacoes.png', { antes: (p) => p.getByRole('button', { name: /^G\b/ }).first().click() });
await tela(celular, '/produto/?id=cob-estampado-casal', '02c-produto-zoom.png', {
  antes: async (p) => {
    await p.getByRole('button', { name: 'Ampliar foto' }).first().click();
    await p.waitForTimeout(300);
    await p.mouse.click(195, 400);
  },
});
await tela(celular, '/cotacao/', '03-cotacao.png', { cheio: true, carrinho: true });
await tela(celular, '/', '03b-catalogo-com-cotacao.png', { carrinho: true, antes: (p) => p.evaluate(() => window.scrollTo(0, 700)) });
await tela(celular, '/painel/produtos/', '04-painel-produtos.png', { cheio: true, altura: 1600 });
await tela(celular, '/painel/produtos/editar/?id=short-fitness', '05-produto-editar.png', { cheio: true });
await tela(celular, '/painel/importar/', '06-importar.png', {
  cheio: true,
  antes: async (p) => {
    await p.locator('textarea').fill(IMPORT);
  },
});
await tela(desktop, '/painel/importar/', '06-importar-desktop.png', { cheio: true, antes: (p) => p.locator('textarea').fill(IMPORT) });
await tela(celular, '/painel/pedidos/', '07-pedidos.png', { cheio: true });
await tela(celular, '/painel/pedidos/ver/?id=pd2', '08-pedido-detalhe.png', { cheio: true });
await tela(celular, '/painel/clientes/', '09-clientes.png', { cheio: true });

await b.close();
srv.kill();
