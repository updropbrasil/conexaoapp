// Confere que o app funciona ANTES de rodar supabase/migrations/001 (tabela config ausente).
// Uso: SEM_MIGRACAO=1 bash scripts/teste/subir.sh && node --experimental-strip-types scripts/teste/semear.mjs && node scripts/teste/sem-migracao.mjs
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { join } from 'node:path';
const req = createRequire(import.meta.url);
let pw;
try { pw = req('playwright'); } catch { pw = createRequire('/opt/npm-tools/node_modules/')('playwright'); }
const sql = (q) => execSync(`psql -h /tmp -p 54329 -U postgres -d conexao -tA -c ${JSON.stringify(q)}`).toString().trim();
let f = 0;
const checa = (c, m) => (console.log(c ? '  ✓' : '  ✗', m), c || f++);
checa(sql("select to_regclass('public.config') is null") === 't', 'banco sem a tabela config (migração 001 não aplicada)');
const srv = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { cwd: join(process.cwd(), 'out'), stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const b = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
try {
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await p.getByText('30 produtos').waitFor({ timeout: 10000 });
  checa(true, 'catálogo abre com o visual padrão');
  await p.evaluate(() => localStorage.setItem('conexao.cotacao.v2', JSON.stringify([{ chave: document.querySelector('main a[href*="/produto/"]').href.split('id=')[1], qtd: 30 }])));
  await p.goto('http://127.0.0.1:4173/cotacao/', { waitUntil: 'networkidle' });
  await p.getByLabel('Nome da loja / empresa').fill('Sem Migração');
  await p.getByLabel('Seu WhatsApp').fill('83988887777');
  await p.getByRole('button', { name: 'Enviar cotação' }).click();
  await p.getByText('Recebemos sua cotação!').waitFor();
  checa(sql("select status from cotacoes where cliente_nome='Sem Migração'") === 'pendente', 'cotação enviada normalmente');
  await p.goto('http://127.0.0.1:4173/entrar/', { waitUntil: 'networkidle' });
  await p.getByLabel('E-mail').fill('representante@teste.com');
  await p.getByLabel('Senha').fill('senha-teste');
  await p.getByRole('button', { name: 'Entrar' }).click();
  await p.waitForURL(/painel\/pedidos/);
  await p.goto('http://127.0.0.1:4173/painel/aparencia/', { waitUntil: 'networkidle' });
  await p.getByText('A tabela de configuração ainda não foi criada').waitFor();
  checa(true, 'tela Aparência avisa que falta a migração, sem quebrar');
} catch (e) {
  checa(false, 'ERRO: ' + e.message.split('\n')[0]);
}
checa(!erros.length, 'sem erros de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
const anon = (t, d) => execSync(`curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:54321/rest/v1/${t} -H "Authorization: Bearer sb_x" -H "content-type: application/json" -d '${d}'`).toString();
const r = anon('produtos', '{"nome":"invasor"}');
console.log(`  i  com as policies atuais, visitante sem login inserindo em produtos → HTTP ${r} (${r === '201' ? 'ACEITO: brecha que a migração 001 fecha' : 'bloqueado'})`);
await b.close();
srv.kill();
process.exit(f ? 1 : 0);
