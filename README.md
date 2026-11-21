# Conexão Vendas (v2)

Catálogo de atacado + painel do representante da **Conexão Indústria & Varejo** — `conexaovendas.com.br`.

- **Next.js (App Router) + TypeScript + Tailwind**, exportado como site estático (`out/`) e servido por **nginx** num container.
- **Supabase** (projeto `xhifutmfnkogmikeoojx`): banco, login do representante e fotos (bucket público `produtos`).
- **PWA** instalável (manifest + service worker com cache de fotos). Sem notificações push.

## O que tem

| Área pública | Painel (login) |
| --- | --- |
| Catálogo com categorias, busca, “Chegou agora” | Pedidos (mês, faturamento, comissão, status, novo pedido manual) |
| Página do produto: galeria com zoom, opções, faixas de atacado, múltiplo | Pedido: itens, status, transportadora, parcelas, PDF, WhatsApp |
| Cotação: preço de faixa aplicado, pedido mínimo, “Pedir cotação” / “Fazer pedido” | Cotações: editar, WhatsApp, gerar pedido (um por categoria) |
| Cadastro da loja | Produtos: cadastro com fotos comprimidas, opções, faixas |
| | Importar catálogo (JSON/CSV do Claude) + fotos em lote |
| | Clientes, Categorias, Financeiro (calendário, recebimentos, relatório), Aparência |

“Fazer pedido” é gravado em `cotacoes` com `status = 'fechar'` (aparece como **Quer fechar** no painel).

## Fotos leves

Ao salvar, o navegador reduz cada foto para **1200 px WebP (qualidade 0,8)** e gera a **miniatura de 300 px**.
Caminho: `produtos/<id-do-produto>/<n>.webp` e `<n>-300.webp`, com `Cache-Control` de 1 ano (cada envio tem nome novo).
Listas e grades só baixam a miniatura (`loading="lazy"`); a foto grande só abre na página do produto.
O service worker guarda as fotos no aparelho. Medido: foto de 12 MP (2,2 MB) → 226 KB + miniatura 28 KB.

## Banco: SQL pendente

Rode **uma vez** no SQL Editor do Supabase: [`supabase/migrations/001_config_e_fotos.sql`](supabase/migrations/001_config_e_fotos.sql)

1. cria a tabela `config` (banner + tema) — leitura pública, escrita só logado;
2. permite ao representante apagar fotos do Storage (sem isso, fotos trocadas ficam ocupando espaço);
3. **segurança**: hoje as policies deixam visitante sem login INSERIR em produtos, pedidos etc. (`WITH CHECK (true)`); o SQL passa a exigir login.

O app funciona antes disso (usa o visual padrão). `000_estrutura_atual.sql` é só a referência do que já existe.

## Deploy no Coolify

1. No recurso atual (repo `updropbrasil/conexaoapp`), em **Configuration → General**:
   - **Branch**: `main` (depois do merge do PR) — ou `claude/app-v2` para testar num recurso separado;
   - **Build Pack**: troque de *Static* para **Dockerfile** (arquivo `Dockerfile` na raiz);
   - **Ports Exposes**: `80`;
   - **Domains**: `https://conexaovendas.com.br,https://www.conexaovendas.com.br`.
2. (Opcional) **Environment Variables** marcadas como *Build Variable*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_REP`. Sem elas, usa os valores do projeto novo.
3. **Deploy**. O container tem healthcheck; se algo der errado, o Coolify mantém o anterior. Para voltar ao app antigo: *Redeploy* do commit anterior.
4. Depois do primeiro acesso, o service worker novo substitui o antigo e apaga o cache velho sozinho.

O nginx (`nginx.conf`) faz gzip, cache de 1 ano em `/_next/static` e fontes, e **sem cache** em HTML, `sw.js` e `manifest.json`.

## Desenvolvimento

```bash
npm ci
npm run dev          # http://localhost:3000 (usa o Supabase de produção!)
npm run build        # gera out/
npm run typecheck
```

### Testes (Supabase local de bolso)

Postgres 16 + [PostgREST](https://postgrest.org) + `scripts/teste/gateway.mjs` (imita auth/storage do Supabase) — o app usa o supabase-js de verdade e as policies RLS de verdade.

```bash
npm run teste:subir                                   # recria o banco local (000 + 001) e semeia dados de exemplo
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 npm run build
npm run teste:e2e                                     # 53 verificações ponta a ponta (Playwright)
SEM_MIGRACAO=1 bash scripts/teste/subir.sh && node --experimental-strip-types scripts/teste/semear.mjs && npm run teste:sem-migracao
npm run prints -- /pasta/dos/prints
```
Login de teste: `representante@teste.com` / `senha-teste`. Dados de exemplo e fotos ilustrativas ficam em `scripts/teste/` (não vão para o site).
