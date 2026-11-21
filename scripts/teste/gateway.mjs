// "Supabase de bolso" para TESTES locais: imita as rotas que o app usa, com o supabase-js de verdade do lado do app.
//  /rest/v1/*     → PostgREST real (com RLS do Postgres local); a chave pública vira um JWT "anon"
//  /auth/v1/*     → login por senha (1 usuário de teste), refresh, user, logout
//  /storage/v1/*  → upload (multipart ou binário), leitura pública com Cache-Control, list e remove
// Uso: node scripts/teste/gateway.mjs  (variáveis: PORTA, PGRST, SEGREDO, PASTA_STORAGE, EMAIL, SENHA)
import http from 'node:http';
import crypto from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PORTA = +(process.env.PORTA || 54321);
const PGRST = process.env.PGRST || 'http://127.0.0.1:54330';
const SEGREDO = process.env.SEGREDO || 'segredo-de-teste-com-pelo-menos-32-caracteres!!';
const PASTA = process.env.PASTA_STORAGE || '/tmp/conexao-storage';
const EMAIL = process.env.EMAIL || 'representante@teste.com';
const SENHA = process.env.SENHA || 'senha-teste';
const USER = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: EMAIL, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() };
mkdirSync(PASTA, { recursive: true });

const b64u = (b) => Buffer.from(b).toString('base64url');
function jwt(payload) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(payload));
  const s = crypto.createHmac('sha256', SEGREDO).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
function lerJwt(t) {
  try {
    const [h, p, s] = t.split('.');
    if (crypto.createHmac('sha256', SEGREDO).update(`${h}.${p}`).digest('base64url') !== s) return null;
    const c = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (c.exp && c.exp * 1000 < Date.now()) return null;
    return c;
  } catch {
    return null;
  }
}
const agora = () => Math.floor(Date.now() / 1000);
const ANON = jwt({ role: 'anon', iat: agora(), exp: agora() + 10 * 365 * 86400 });
const sessao = () => {
  const exp = agora() + 3600;
  return { access_token: jwt({ sub: USER.id, role: 'authenticated', aud: 'authenticated', email: EMAIL, iat: agora(), exp }), token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'rt-' + crypto.randomUUID(), user: USER };
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
  'access-control-allow-headers': 'authorization,apikey,content-type,prefer,range,x-client-info,x-upsert,cache-control,accept-profile,content-profile,x-supabase-api-version,accept',
  'access-control-expose-headers': 'content-range,content-location,x-total-count',
};
const json = (res, st, obj, extra = {}) => {
  res.writeHead(st, { 'content-type': 'application/json', ...CORS, ...extra });
  res.end(obj === undefined ? '' : JSON.stringify(obj));
};
const corpo = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
const claims = (req) => {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return lerJwt(t) || { role: 'anon' };
};
const log = [];

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'OPTIONS') return json(res, 204);
    const body = await corpo(req);
    log.push(`${req.method} ${url.pathname}`);

    // ---------- REST ----------
    if (url.pathname.startsWith('/rest/v1')) {
      const c = claims(req);
      const headers = { ...req.headers };
      delete headers.host;
      delete headers['content-length'];
      headers.authorization = 'Bearer ' + (c.role === 'authenticated' ? req.headers.authorization.replace(/^Bearer\s+/i, '') : ANON);
      const r = await fetch(PGRST + url.pathname.replace('/rest/v1', '') + url.search, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
      const out = Buffer.from(await r.arrayBuffer());
      const h = { ...CORS };
      r.headers.forEach((v, k) => { if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(k)) h[k] = v; });
      res.writeHead(r.status, h);
      return res.end(out);
    }

    // ---------- AUTH ----------
    if (url.pathname === '/auth/v1/token') {
      const d = body.length ? JSON.parse(body.toString()) : {};
      const g = url.searchParams.get('grant_type');
      if (g === 'password') {
        if (d.email === EMAIL && d.password === SENHA) return json(res, 200, sessao());
        return json(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      }
      if (g === 'refresh_token') return json(res, 200, sessao());
      return json(res, 400, { msg: 'grant_type não suportado' });
    }
    if (url.pathname === '/auth/v1/user') return claims(req).role === 'authenticated' ? json(res, 200, USER) : json(res, 401, { msg: 'JWT inválido' });
    if (url.pathname === '/auth/v1/logout') return json(res, 204);

    // ---------- STORAGE ----------
    const m = url.pathname.match(/^\/storage\/v1\/object\/(public\/)?([^/]+)\/?(.*)$/);
    if (url.pathname.startsWith('/storage/v1/object/list/')) {
      const bucket = url.pathname.split('/').pop();
      const d = JSON.parse(body.toString() || '{}');
      const dir = join(PASTA, bucket, d.prefix || '');
      const itens = existsSync(dir) ? readdirSync(dir).filter((n) => !n.endsWith('.meta.json')).map((n) => ({ name: n, id: n, metadata: { size: statSync(join(dir, n)).size } })) : [];
      return json(res, 200, itens);
    }
    if (m) {
      const [, publico, bucket, caminho] = m;
      const arq = join(PASTA, bucket, decodeURIComponent(caminho));
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (!existsSync(arq)) return json(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
        const meta = JSON.parse(readFileSync(arq + '.meta.json', 'utf8'));
        res.writeHead(200, { 'content-type': meta.tipo, 'cache-control': meta.cache, 'content-length': meta.tamanho, ...CORS });
        return res.end(req.method === 'HEAD' ? undefined : readFileSync(arq));
      }
      if (publico) return json(res, 405, {});
      if (claims(req).role !== 'authenticated') return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
      if (req.method === 'DELETE') {
        const d = JSON.parse(body.toString() || '{}');
        const apagados = [];
        for (const p of d.prefixes || []) {
          const f = join(PASTA, bucket, p);
          if (existsSync(f)) { rmSync(f); rmSync(f + '.meta.json', { force: true }); apagados.push({ name: p }); }
        }
        return json(res, 200, apagados);
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        if (req.method === 'POST' && existsSync(arq) && req.headers['x-upsert'] !== 'true') return json(res, 400, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
        let dados = body;
        let tipo = req.headers['content-type'] || 'application/octet-stream';
        let cache = req.headers['cache-control'] || 'max-age=3600';
        if (tipo.startsWith('multipart/form-data')) {
          const fd = await new Request('http://x', { method: 'POST', headers: { 'content-type': tipo }, body }).formData();
          let file = null;
          for (const [k, v] of fd.entries()) if (typeof v !== 'string') file = v;
          cache = `max-age=${fd.get('cacheControl') || 3600}`;
          tipo = file.type || 'application/octet-stream';
          dados = Buffer.from(await file.arrayBuffer());
        }
        mkdirSync(dirname(arq), { recursive: true });
        writeFileSync(arq, dados);
        writeFileSync(arq + '.meta.json', JSON.stringify({ tipo, cache: cache.startsWith('max-age') ? `public, ${cache}` : cache, tamanho: dados.length }));
        return json(res, 200, { Id: crypto.randomUUID(), Key: `${bucket}/${caminho}` });
      }
    }
    if (url.pathname === '/__log') return json(res, 200, log);
    json(res, 404, { msg: 'rota não simulada: ' + url.pathname });
  })
  .listen(PORTA, '127.0.0.1', () => console.log(`gateway em http://127.0.0.1:${PORTA} (PostgREST ${PGRST})`));
