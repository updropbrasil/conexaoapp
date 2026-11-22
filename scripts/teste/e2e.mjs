// Teste ponta a ponta: navegador de verdade (Playwright) + supabase-js de verdade + PostgREST/RLS de verdade (Postgres local).
// Pré-requisitos: scripts/teste/subir.sh + semear.mjs, e o app construído com NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321.
// Uso: node scripts/teste/e2e.mjs
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const req = createRequire(import.meta.url);
let pw;
try { pw = req('playwright'); } catch { pw = createRequire('/opt/npm-tools/node_modules/')('playwright'); }
const sharp = req('sharp');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const API = 'http://127.0.0.1:54321';
const STORAGE = '/tmp/conexao-storage/produtos';
const TMP = '/tmp/conexao-e2e';
mkdirSync(TMP, { recursive: true });
const sql = (q) => execSync(`psql -h /tmp -p 54329 -U postgres -d conexao -tA -c ${JSON.stringify(q)}`).toString().trim();
let falhas = 0;
let passos = 0;
const checa = (cond, msg, extra = '') => {
  passos++;
  if (cond) console.log('  ✓', msg, extra);
  else { falhas++; console.log('  ✗', msg, extra); }
};
const kb = (b) => Math.round(b / 1024) + ' KB';

const srv = process.env.BASE ? null : spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { cwd: join(process.cwd(), 'out'), stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const b = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'pt-BR', acceptDownloads: true });
const p = await ctx.newPage();
const erros = [];
const requisicoes = new Set();
p.on('pageerror', (e) => erros.push(e.message));
p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|viacep/.test(m.text()) && erros.push(m.text()));
p.on('request', (r) => /^https?:/.test(r.url()) && requisicoes.add(new URL(r.url()).host));
p.on('dialog', (d) => d.accept());
const ir = async (u) => { await p.goto(BASE + u, { waitUntil: 'networkidle' }); };

try {
  console.log('\n1. Catálogo público');
  await ir('/');
  await p.getByText('30 produtos').waitFor({ timeout: 10000 });
  checa(true, 'catálogo carregou 30 produtos do banco');
  checa((await p.getByRole('button', { name: /Cama, Mesa e Banho/ }).count()) === 1, 'categorias vindas de fornecedores');
  await p.getByPlaceholder('Buscar produto ou referência').fill('sublime');
  await p.getByText('1 produto', { exact: true }).waitFor();
  checa(true, 'busca filtra ("sublime" → 1 produto)');
  const mini = await p.locator('main img').first().getAttribute('src');
  checa(/-300\.webp$/.test(mini), 'grade usa a miniatura -300.webp', mini.split('/').slice(-1)[0]);
  checa((await p.locator('main img').first().getAttribute('loading')) === 'lazy', 'miniaturas com loading="lazy"');

  console.log('\n2. Produto');
  await p.getByPlaceholder('Buscar produto ou referência').fill('estampado');
  await p.locator('main a[href*="/produto/"]').first().click();
  await p.getByText('Preço de atacado: quanto mais, menor').waitFor();
  checa(true, 'página do produto abre ao tocar no cartão (galeria + faixas)');
  checa((await p.getByRole('button', { name: 'Ampliar foto' }).count()) === 3, 'galeria com 3 fotos');
  await p.getByRole('button', { name: 'Ampliar foto' }).first().click();
  await p.getByRole('button', { name: 'Fechar' }).click();
  for (let k = 0; k < 4; k++) await p.getByRole('button', { name: 'Aumentar' }).click(); // 40 → 200
  await p.getByRole('button', { name: /Adicionar.*R\$ 3\.200,00/ }).click();
  checa(true, 'adicionou 200 un. (R$ 3.200,00)');
  await ir('/produto/?id=' + sql("select id from produtos where ref='SHT-FIT-DUP'"));
  await p.getByRole('button', { name: /^G\b/ }).first().click();
  await p.getByRole('button', { name: /Adicionar/ }).click();

  console.log('\n3. Cotação (anônimo) — "Fazer pedido"');
  await ir('/cotacao/');
  checa(await p.getByText('R$ 15,20').first().isVisible(), 'faixa de atacado aplicada (≥ R$ 3.000 → R$ 15,20)');
  await p.getByRole('button', { name: 'Fazer pedido' }).click();
  await p.getByLabel('Nome da loja / empresa').fill('Loja Teste E2E');
  await p.getByLabel('Seu WhatsApp').fill('83999990000');
  await p.getByRole('button', { name: 'Enviar pedido' }).click();
  await p.getByText('Recebemos sua solicitação de pedido!').waitFor();
  const cot = sql("select status||'|'||(select count(*) from cotacao_itens i where i.cotacao_id=c.id)||'|'||(select string_agg(preco::text,',' order by preco) from cotacao_itens i where i.cotacao_id=c.id) from cotacoes c where cliente_nome='Loja Teste E2E'");
  checa(cot === 'fechar|2|15.2,30', 'cotação gravada sem login com status "fechar" e preços certos', cot);
  const anonLe = execSync(`curl -s "${API}/rest/v1/cotacoes?select=*" -H "Authorization: Bearer sb_publishable_x"`).toString();
  checa(anonLe === '[]', 'visitante NÃO consegue ler cotações (RLS)');

  console.log('\n4. Cadastro público');
  await ir('/cadastro/');
  await p.getByLabel('Nome da loja / empresa').fill('Loja Teste E2E');
  await p.getByLabel('CPF / CNPJ').fill('12345678000199');
  await p.getByLabel('WhatsApp').fill('83999990000');
  await p.getByLabel('Cidade/UF').fill('João Pessoa/PB');
  await p.getByRole('button', { name: 'Finalizar cadastro' }).click();
  await p.getByText('Cadastro recebido!').waitFor();
  checa(sql("select doc from clientes where nome='Loja Teste E2E'") === '12.345.678/0001-99', 'cliente cadastrado com CNPJ formatado');

  console.log('\n5. Login');
  await ir('/painel/pedidos/');
  await p.waitForURL(/\/entrar\//);
  checa(true, 'painel sem login redireciona para /entrar');
  await p.getByLabel('E-mail').fill('representante@teste.com');
  await p.getByLabel('Senha').fill('errada');
  await p.getByRole('button', { name: 'Entrar' }).click();
  await p.getByText('E-mail ou senha incorretos.').waitFor();
  checa(true, 'senha errada mostra erro em português');
  await p.getByLabel('Senha').fill('senha-teste');
  await p.getByRole('button', { name: 'Entrar' }).click();
  await p.waitForURL(/\/painel\/pedidos\//);
  await p.getByText('Faturamento do mês').waitFor();
  checa(true, 'login ok → pedidos');

  console.log('\n6. Cotações → gerar pedido');
  await ir('/painel/cotacoes/');
  await p.getByText('Quer fechar').first().waitFor();
  checa(true, 'cotação aparece marcada "Quer fechar"');
  await p.getByRole('button', { name: /Loja Teste E2E/ }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Aumentar' }).first().click();
  await p.waitForTimeout(600);
  checa(sql("select sum(qtd) from cotacao_itens i join cotacoes c on c.id=i.cotacao_id where c.cliente_nome='Loja Teste E2E'") === '231', 'quantidade editada na cotação (230 → 231)');
  await p.getByRole('dialog').getByRole('button', { name: 'Gerar pedido' }).click();
  await p.waitForURL(/\/painel\/pedidos\//);
  const peds = sql("select string_agg(numero||':'||fornecedor, ',' order by numero) from pedidos where cliente_nome='Loja Teste E2E'");
  checa(peds === '#1085:Cama, Mesa e Banho,#1086:Esporte Fitness', 'gerou 1 pedido por categoria com numeração seguida', peds);
  checa(sql("select status from cotacoes where cliente_nome='Loja Teste E2E'") === 'pedido', 'cotação marcada como "pedido"');
  checa(sql("select ja_pediu from clientes where nome='Loja Teste E2E'") === 't', 'cliente marcado "já pediu"');
  checa(sql("select count(*) from pedido_itens i join pedidos p on p.id=i.pedido_id where p.numero='#1085' and i.custo is not null") === '1', 'item do pedido guarda o custo (comissão)');

  console.log('\n7. Pedido: parcelas, status, transportadora, PDF');
  const pid = sql("select id from pedidos where numero='#1085'");
  await ir('/painel/pedidos/ver/?id=' + pid);
  await p.getByText('Gerar parcelas').waitFor();
  await p.getByLabel('Parcelas').fill('3');
  await p.getByRole('button', { name: 'Gerar parcelas' }).click();
  await p.getByText('1/3 ·').waitFor();
  const parc = sql(`select count(*)||'|'||sum(valor)||'|'||(select sum(qtd*preco) from pedido_itens where pedido_id='${pid}') from parcelas where pedido_id='${pid}'`);
  const [nP, somaP, totP] = parc.split('|');
  checa(nP === '3' && Number(somaP) === Number(totP), '3 parcelas somando o total do pedido', parc);
  await p.getByRole('button', { name: 'Receber' }).first().click();
  await p.getByRole('button', { name: /Pago/ }).waitFor();
  checa(sql(`select count(*) from parcelas where pedido_id='${pid}' and recebido`) === '1', 'parcela marcada como recebida');
  await p.getByLabel('Status do pedido').selectOption('faturado');
  await p.waitForTimeout(500);
  checa(sql(`select status from pedidos where id='${pid}'`) === 'faturado', 'status alterado para faturado');
  await p.getByPlaceholder('Ex.: Braspress').fill('Jadlog');
  await p.getByPlaceholder('Ex.: Braspress').blur();
  await p.waitForTimeout(500);
  checa(sql(`select transportadora from pedidos where id='${pid}'`) === 'Jadlog', 'transportadora salva');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'PDF' }).click()]);
  const pdf = join(TMP, 'pedido.pdf');
  await dl.saveAs(pdf);
  checa(statSync(pdf).size > 2000, 'PDF do pedido gerado', kb(statSync(pdf).size));

  console.log('\n8. Novo pedido manual');
  await ir('/painel/pedidos/');
  await p.getByRole('button', { name: 'Novo' }).click();
  await p.getByPlaceholder('Digite o nome da loja').fill('Bazar Dois');
  await p.getByRole('button', { name: /Bazar Dois Irmãos/ }).click();
  await p.getByPlaceholder('Nome ou referência').fill('cabide preto');
  await p.getByRole('dialog').getByRole('button', { name: /Cabide Preto/ }).click();
  await p.getByRole('button', { name: 'Criar pedido' }).click();
  await p.waitForTimeout(800);
  checa(sql("select count(*) from pedidos where numero='#1087' and cliente_nome='Bazar Dois Irmãos'") === '1', 'pedido manual #1087 criado');

  console.log('\n9. Financeiro');
  await ir('/painel/financeiro/');
  await p.getByText('A receber no mês').waitFor();
  await p.getByRole('button', { name: 'Recebimento' }).click();
  await p.getByRole('dialog').getByLabel('Valor (R$)').fill('250,50');
  await p.getByRole('dialog').getByLabel('Comissão (R$)').fill('25');
  await p.getByRole('dialog').getByLabel('Observação').fill('acerto e2e');
  await p.getByRole('button', { name: 'Salvar recebimento' }).click();
  await p.locator('li', { hasText: 'acerto e2e' }).first().waitFor();
  checa(sql("select valor from lancamentos where descricao='acerto e2e'") === '250.5', 'recebimento avulso salvo (R$ 250,50)');
  await p.locator('li', { hasText: 'acerto e2e' }).getByRole('button', { name: 'Recebido' }).click();
  await p.waitForTimeout(500);
  checa(sql("select recebido from lancamentos where descricao='acerto e2e'") === 't', 'recebimento marcado como recebido');

  console.log('\n10. Clientes');
  await ir('/painel/clientes/');
  await p.getByRole('button', { name: 'Novo' }).click();
  await p.getByRole('dialog').getByLabel('Nome da loja / empresa').fill('Cliente Novo E2E');
  await p.getByRole('dialog').getByLabel('WhatsApp').fill('8332220000');
  await p.getByRole('dialog').getByRole('button', { name: 'Salvar' }).click();
  await p.getByText('Cliente Novo E2E').waitFor();
  checa(sql("select tel from clientes where nome='Cliente Novo E2E'") === '(83) 3222-0000', 'cliente criado no painel');

  console.log('\n11. Categorias');
  await ir('/painel/categorias/');
  await p.getByRole('button', { name: 'Nova' }).click();
  await p.getByRole('dialog').getByLabel('Nome').fill('Brinquedos E2E');
  await p.getByRole('dialog').getByRole('button', { name: 'Salvar' }).click();
  await p.getByText('Brinquedos E2E').waitFor();
  checa(sql("select count(*) from fornecedores where nome='Brinquedos E2E'") === '1', 'categoria criada');

  console.log('\n12. Cadastro de produto com upload de foto grande');
  const grande = join(TMP, 'foto-celular.jpg');
  const W = 4032, H = 3024;
  const ruido = Buffer.alloc(W * H * 3);
  for (let i = 0; i < ruido.length; i += 3) { const x = (i / 3) % W, y = Math.floor(i / 3 / W); ruido[i] = (x * 255) / W ^ (Math.random() * 40); ruido[i + 1] = (y * 255) / H ^ (Math.random() * 40); ruido[i + 2] = 128 + Math.random() * 60; }
  await sharp(ruido, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toFile(grande);
  const pior = join(TMP, 'ruido.jpg');
  await sharp(Buffer.from(Array.from({ length: 3000 * 2250 * 3 }, () => (Math.random() * 256) | 0)), { raw: { width: 3000, height: 2250, channels: 3 } }).jpeg({ quality: 90 }).toFile(pior);
  // foto real (opcional): FOTO_REAL=/caminho.jpg — ampliada para o tamanho de uma foto de celular (12 MP)
  const real = join(TMP, 'foto-real.jpg');
  const temReal = !!process.env.FOTO_REAL && existsSync(process.env.FOTO_REAL);
  if (temReal) await sharp(process.env.FOTO_REAL).resize(4032, 3024, { fit: 'cover' }).jpeg({ quality: 92 }).toFile(real);
  const grande2 = join(TMP, 'foto2.png');
  await sharp({ create: { width: 2400, height: 3200, channels: 4, background: { r: 30, g: 90, b: 160, alpha: 1 } } }).png().toFile(grande2);
  await ir('/painel/produtos/editar/');
  await p.getByPlaceholder('Ex.: Cobertor Microfibra Casal 1,80x2,00').fill('Produto Teste Foto Grande');
  await p.getByPlaceholder('Ex.: COB-LISO-CAS').fill('TST-FOTO');
  await p.getByPlaceholder('0,00').first().fill('10,00');
  await p.locator('input[type=file]').setInputFiles(temReal ? [grande, grande2, pior, real] : [grande, grande2, pior]);
  await p.getByRole('button', { name: 'Salvar produto' }).click();
  await p.waitForURL(/\/painel\/produtos\/$/, { timeout: 30000 });
  const prod = sql("select id||'|'||preco||'|'||coalesce(img_url,'') from produtos where ref='TST-FOTO'");
  const [tid, tpreco, timg] = prod.split('|');
  checa(Number(tpreco) === 13, 'preço calculado custo + 30% = 13,00 (placeholder sugerido)', tpreco);
  checa(sql(`select count(*) from produto_fotos where produto_id='${tid}'`) === String(temReal ? 4 : 3) && /\.webp$/.test(timg), 'galeria com todas as fotos e capa .webp');
  const arqs = readdirSync(join(STORAGE, tid)).filter((n) => !n.endsWith('.meta.json'));
  const tam = Object.fromEntries(arqs.map((n) => [n, statSync(join(STORAGE, tid, n)).size]));
  const grandes = arqs.filter((n) => !n.includes('-300'));
  const minis = arqs.filter((n) => n.includes('-300'));
  const capa = timg.split('/').pop();
  const meta = JSON.parse(execSync(`cat ${join(STORAGE, tid, capa)}.meta.json`).toString());
  const dimG = await sharp(join(STORAGE, tid, capa)).metadata();
  const dimM = await sharp(join(STORAGE, tid, capa.replace('.webp', '-300.webp'))).metadata();
  checa(grandes.length === (temReal ? 4 : 3) && minis.length === grandes.length, `${grandes.length * 2} arquivos no Storage (grandes + miniaturas)`);
  checa(Math.max(dimG.width, dimG.height) === 1200 && Math.min(dimM.width, dimM.height) === 300, `grande ${dimG.width}×${dimG.height}, miniatura ${dimM.width}×${dimM.height}`);
  checa(meta.cache === 'public, max-age=31536000' && meta.tipo === 'image/webp', 'enviado como image/webp com cache de 1 ano');
  const orig = statSync(grande).size;
  console.log(`     tamanhos: JPEG do "celular" ${W}×${H} = ${kb(orig)} → grande ${kb(tam[capa])} + miniatura ${kb(tam[capa.replace('.webp', '-300.webp')])}`);
  const ordem = sql(`select string_agg(url, ' ' order by ordem) from produto_fotos where produto_id='${tid}'`).split(' ').map((u) => u.split('/').pop());
  console.log(`     PNG 2400×3200 = ${kb(statSync(grande2).size)} → ${kb(tam[ordem[1]])} + ${kb(tam[ordem[1].replace('.webp', '-300.webp')])}`);
  console.log(`     pior caso (ruído puro) 3000×2250 = ${kb(statSync(pior).size)} → ${kb(tam[ordem[2]])} + ${kb(tam[ordem[2].replace('.webp', '-300.webp')])}`);
  if (temReal) console.log(`     foto real 4032×3024 = ${kb(statSync(real).size)} → ${kb(tam[ordem[3]])} + ${kb(tam[ordem[3].replace('.webp', '-300.webp')])}`);
  writeFileSync(join(TMP, 'tamanhos.json'), JSON.stringify({ orig, png: statSync(grande2).size, tam, capa }));

  console.log('\n13. Editar produto: reordenar e apagar foto');
  await ir('/painel/produtos/editar/?id=' + tid);
  await p.getByRole('button', { name: 'Mover para a direita' }).first().click();
  await p.getByRole('button', { name: 'Remover foto' }).nth(1).click(); // remove a que era capa
  await p.getByRole('button', { name: 'Salvar produto' }).click();
  await p.waitForURL(/\/painel\/produtos\/$/);
  const novaCapa = sql(`select img_url from produtos where id='${tid}'`).split('/').pop();
  checa(novaCapa !== capa && sql(`select count(*) from produto_fotos where produto_id='${tid}'`) === String(temReal ? 3 : 2), 'capa trocada e uma foto a menos');
  checa(!existsSync(join(STORAGE, tid, capa)) && !existsSync(join(STORAGE, tid, capa.replace('.webp', '-300.webp'))), 'foto removida apagada do Storage (grande + miniatura)');

  console.log('\n14. Importação (JSON com duplicados)');
  const json = JSON.stringify([
    { nome: 'Cobertor Microfibra Canelado Casal 1,80x2,00', ref: 'COB-CAN-CAS', linha: 'Cobertores', custo: 14.9, min: 40 },
    { nome: 'Cobertor Microfibra Canelado Queen 2,20x2,40', ref: 'COB-CAN-QUE', linha: 'Cobertores', custo: 19.8, min: 40 },
    { nome: 'Edredom Dupla Face Casal', ref: 'EDR-DF-CAS', linha: 'Edredons', custo: 42.5, min: 10 },
    { nome: 'Fronha — Kit c/4 48x68', ref: 'FRO-NOVA', linha: 'Travesseiros', custo: 9, min: 30 },
    { nome: 'Travesseiro Sublime 70x50', ref: '', linha: 'Travesseiros', custo: 12.1, min: 30 },
    { nome: 'Jogo de Toalha Banho + Rosto', ref: 'TOA-JG-2P', linha: 'Toalhas', custo: 18.4, min: 24, variacoes: [{ nome: 'Branco', ref: 'TOA-JG-BR', custo: 18.4 }, { nome: 'Areia', ref: 'TOA-JG-AR', custo: 19 }] },
    { nome: 'Toalha de Rosto 48x80', ref: 'TOA-ROS-48', custo: 6.2, min: 48 },
    { nome: 'Toalha de Rosto 48x80 (repetida)', ref: 'TOA-ROS-48', custo: 6.2, min: 48 },
    { nome: 'Kit Lençol Percal', ref: 'LEN-KIT-PER', custo: null, min: 12 },
  ]);
  await ir('/painel/importar/');
  await p.locator('select').first().selectOption(sql("select id from fornecedores where nome='Cama, Mesa e Banho'"));
  await p.locator('textarea').fill(json);
  await p.getByText('5 novos').first().waitFor();
  checa(await p.getByText('3 duplicados').first().isVisible(), 'prévia: 5 novos · 3 duplicados · 1 com erro (Fronha com ref nova NÃO é duplicado)');
  await p.getByRole('button', { name: /Importar 7/ }).click();
  await p.getByText('5 criados · 2 atualizados').waitFor({ timeout: 15000 });
  checa(true, 'importou: 5 criados, 2 atualizados');
  checa(sql("select custo||'|'||preco from produtos where ref='COB-CAN-CAS'") === '14.9|19.37', 'duplicado por referência atualizado (custo 14,90 → venda 19,37)');
  checa(sql("select count(*) from produtos where nome='Travesseiro Sublime 70x50'") === '1' && sql("select custo from produtos where nome='Travesseiro Sublime 70x50'") === '12.1', 'duplicado sem referência (por nome) atualizado, sem criar outro');
  checa(sql("select count(*) from produtos where ref='TOA-ROS-48'") === '1', 'repetido na própria lista entrou uma vez só');
  checa(sql("select count(*) from produtos where ref='LEN-KIT-PER'") === '0', 'linha com erro ficou de fora');
  checa(sql("select string_agg(v.nome||'='||v.preco, ',' order by v.preco) from produto_variacoes v join produtos p on p.id=v.produto_id where p.ref='TOA-JG-2P'") === 'Branco=23.92,Areia=24.7', 'variações importadas com margem');

  console.log('\n15. Fotos em lote (nome do arquivo = referência)');
  const lote = join(TMP, 'COB-CAN-QUE.jpg');
  await sharp({ create: { width: 3000, height: 3000, channels: 3, background: '#8a5' } }).jpeg().toFile(lote);
  await p.locator('input[type=file]').setInputFiles([lote, join(TMP, 'foto2.png')]);
  await p.getByText(/foto\(s\) vinculada/).waitFor({ timeout: 20000 });
  const st = await p.getByText(/foto\(s\) vinculada/).textContent();
  checa(/✓ 1 foto/.test(st) && /sem produto: foto2\.png/.test(st), 'casou COB-CAN-QUE.jpg e apontou o arquivo sem produto', st.trim());
  checa(sql("select count(*) from produto_fotos f join produtos p on p.id=f.produto_id where p.ref='COB-CAN-QUE'") === '1', 'foto vinculada ao produto importado');

  console.log('\n16. Aparência');
  await ir('/painel/aparencia/');
  await p.getByRole('button', { name: 'Verde' }).click();
  await p.waitForTimeout(500);
  checa(sql("select valor from config where chave='tema'") === 'verde', 'tema salvo na tabela config');
  await ir('/');
  await p.waitForTimeout(800);
  const cor = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-tinta').trim());
  checa(cor === '#24561a', 'catálogo aplica o tema salvo', cor);

  console.log('\n17. Excluir produto (apaga fotos do Storage)');
  await ir('/painel/produtos/editar/?id=' + tid);
  await p.getByRole('button', { name: 'Excluir produto' }).click();
  await p.waitForURL(/\/painel\/produtos\/$/);
  checa(sql(`select count(*) from produtos where id='${tid}'`) === '0' && readdirSync(join(STORAGE, tid)).length === 0, 'produto e arquivos apagados');

  console.log('\n18. Sair');
  await ir('/painel/mais/');
  await p.getByRole('button', { name: 'Sair' }).click();
  await p.waitForURL(/\/entrar\//);
  checa(true, 'logout volta para /entrar');

  console.log('\n19. Geral');
  checa([...requisicoes].every((h) => h.startsWith('127.0.0.1')), 'nenhuma chamada fora do app e do Supabase configurado', [...requisicoes].join(' '));
  checa(erros.length === 0, 'sem erros de JavaScript no console', erros.slice(0, 3).join(' | '));
} catch (e) {
  falhas++;
  console.log('  ✗ ERRO:', e.message.split('\n')[0]);
  await p.screenshot({ path: join(TMP, 'erro.png'), fullPage: true });
  console.log('    print do erro em', join(TMP, 'erro.png'), '| url:', p.url());
}
await b.close();
srv?.kill();
console.log(`\n${passos - falhas}/${passos} verificações ok${falhas ? ` — ${falhas} FALHA(S)` : ''}`);
process.exit(falhas ? 1 : 0);
