// Prints das telas com dados de exemplo (Supabase local). Uso:
//   npm run teste:subir && NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 npm run build && node scripts/teste/prints.mjs [pasta]
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const req = createRequire(import.meta.url);
let pw;
try { pw = req('playwright'); } catch { pw = createRequire('/opt/npm-tools/node_modules/')('playwright'); }
const SAIDA = process.argv[2] || join(process.cwd(), 'prints');
mkdirSync(SAIDA, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const srv = process.env.BASE ? null : spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { cwd: join(process.cwd(), 'out'), stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const sql = (q) => execSync(`psql -h /tmp -p 54329 -U postgres -d conexao -tA -c ${JSON.stringify(q)}`).toString().trim();
const pid = (ref) => sql(`select id from produtos where ref='${ref}'`);
const vid = (ref) => sql(`select id from produto_variacoes where ref='${ref}'`);

const CARRINHO = [
  { chave: pid('COB-LISO-CAS'), qtd: 80 },
  { chave: pid('TRV-SUB-70'), qtd: 30 },
  { chave: pid('COB-CAN-CAS'), qtd: 40 },
  { chave: `${pid('SHT-FIT-DUP')}#${vid('SHT-FIT-DUP-M')}`, qtd: 30 },
  { chave: `${pid('CJ-DRY-GA')}#${vid('CJ-DRY-GA-G')}`, qtd: 30 },
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

// sessão do representante (login uma vez e reaproveita)
const login = await b.newContext(celular);
const lp = await login.newPage();
await lp.goto(BASE + '/entrar/', { waitUntil: 'networkidle' });
await lp.getByLabel('E-mail').fill('representante@teste.com');
await lp.getByLabel('Senha').fill('senha-teste');
await lp.getByRole('button', { name: 'Entrar' }).click();
await lp.waitForURL(/painel/);
const sessao = await login.storageState();
await login.close();

async function tela(ctxOpt, url, arquivo, { cheio = false, antes, carrinho = false, altura, logado = false } = {}) {
  const ctx = await b.newContext({ ...ctxOpt, ...(logado ? { storageState: sessao } : {}) });
  if (carrinho) await ctx.addInitScript((c) => localStorage.setItem('conexao.cotacao.v2', JSON.stringify(c)), CARRINHO);
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  if (cheio) {
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
await tela(celular, `/produto/?id=${pid('COB-LISO-CAS')}`, '02-produto.png', { cheio: true });
await tela(desktop, `/produto/?id=${pid('COB-LISO-CAS')}`, '02-produto-desktop.png');
await tela(celular, `/produto/?id=${pid('SHT-FIT-DUP')}`, '02b-produto-variacoes.png', { antes: (p) => p.getByRole('button', { name: /^G\b/ }).first().click() });
await tela(celular, `/produto/?id=${pid('COB-LISO-CAS')}`, '02c-produto-zoom.png', {
  antes: async (p) => {
    await p.getByRole('button', { name: 'Ampliar foto' }).first().click();
    await p.waitForTimeout(300);
    await p.mouse.click(195, 400);
  },
});
await tela(celular, '/cotacao/', '03-cotacao.png', { cheio: true, carrinho: true, antes: (p) => p.getByRole('button', { name: 'Fazer pedido' }).click() });
await tela(celular, '/', '03b-catalogo-com-cotacao.png', { carrinho: true, antes: (p) => p.evaluate(() => window.scrollTo(0, 700)) });
await tela(celular, '/cadastro/', '03c-cadastro.png', { cheio: true });
await tela(celular, '/entrar/', '10-login.png');
await tela(celular, '/painel/produtos/', '04-painel-produtos.png', { cheio: true, altura: 1600, logado: true });
await tela(celular, `/painel/produtos/editar/?id=${pid('SHT-FIT-DUP')}`, '05-produto-editar.png', { cheio: true, logado: true });
await tela(celular, '/painel/importar/', '06-importar.png', { cheio: true, logado: true, antes: (p) => p.locator('textarea').fill(IMPORT) });
await tela(desktop, '/painel/importar/', '06-importar-desktop.png', { cheio: true, logado: true, antes: (p) => p.locator('textarea').fill(IMPORT) });
await tela(celular, '/painel/pedidos/', '07-pedidos.png', { cheio: true, logado: true });
await tela(celular, `/painel/pedidos/ver/?id=${sql("select id from pedidos where numero='#1083'")}`, '08-pedido-detalhe.png', { cheio: true, logado: true });
await tela(celular, '/painel/clientes/', '09-clientes.png', { cheio: true, logado: true });
await tela(celular, '/painel/cotacoes/', '11-cotacoes.png', { cheio: true, logado: true });
await tela(celular, '/painel/financeiro/', '12-financeiro.png', { cheio: true, logado: true });
await tela(desktop, '/painel/financeiro/', '12-financeiro-desktop.png', { logado: true });
await tela(celular, '/painel/categorias/', '13-categorias.png', { cheio: true, logado: true });
await tela(celular, '/painel/aparencia/', '14-aparencia.png', { cheio: true, logado: true });
await tela(celular, '/painel/pedidos/', '15-novo-pedido.png', { logado: true, antes: async (p) => { await p.getByRole('button', { name: 'Novo' }).click(); await p.getByPlaceholder('Digite o nome da loja').fill('Armarinho Boa Vista'); } });

await b.close();
srv?.kill();
