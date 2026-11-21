-- 000_estrutura_atual.sql — estrutura que JÁ ESTÁ no projeto Supabase novo (xhifutmfnkogmikeoojx).
-- Só referência / recriação. Não precisa rodar de novo. A mudança pendente está em 001_config_e_fotos.sql.

-- 01_estrutura.sql — Conexão Vendas: estrutura (13 tabelas, RLS, policies, bucket)
-- Rodar no SQL Editor do projeto NOVO. Pode rodar mais de uma vez (idempotente).

create extension if not exists pgcrypto;  -- gen_random_uuid() (já nativo no PG13+, por garantia)

create table if not exists public.fornecedores (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  logo text,
  cor integer default 0,
  criado_em timestamp with time zone default now(),
  pedido_minimo numeric,
  constraint fornecedores_pkey PRIMARY KEY (id)
);

create table if not exists public.produtos (
  id uuid not null default gen_random_uuid(),
  fornecedor_id uuid,
  nome text not null,
  ref text,
  preco numeric,
  emoji text,
  img_url text,
  min_mult integer default 1,
  criado_em timestamp with time zone default now(),
  custo numeric,
  margem_tipo text,
  margem_val numeric,
  categoria text,
  constraint produtos_pkey PRIMARY KEY (id),
  constraint produtos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
);

create table if not exists public.produto_faixas (
  id uuid not null default gen_random_uuid(),
  produto_id uuid,
  min_valor numeric not null,
  preco numeric not null,
  constraint produto_faixas_pkey PRIMARY KEY (id),
  constraint produto_faixas_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

create table if not exists public.produto_fotos (
  id uuid not null default gen_random_uuid(),
  produto_id uuid,
  url text not null,
  ordem integer default 0,
  constraint produto_fotos_pkey PRIMARY KEY (id),
  constraint produto_fotos_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

create table if not exists public.produto_variacoes (
  id uuid not null default gen_random_uuid(),
  produto_id uuid,
  nome text not null,
  ref text,
  preco numeric not null,
  constraint produto_variacoes_pkey PRIMARY KEY (id),
  constraint produto_variacoes_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

create table if not exists public.clientes (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  doc text,
  ie text,
  responsavel text,
  tel text,
  endereco text,
  cidade text,
  ja_pediu boolean default false,
  criado_em timestamp with time zone default now(),
  email text,
  cep text,
  constraint clientes_pkey PRIMARY KEY (id)
);

create table if not exists public.cotacoes (
  id uuid not null default gen_random_uuid(),
  cliente_nome text not null,
  cliente_tel text,
  status text default 'pendente'::text,
  criado_em timestamp with time zone default now(),
  constraint cotacoes_pkey PRIMARY KEY (id)
);

create table if not exists public.cotacao_itens (
  id uuid not null default gen_random_uuid(),
  cotacao_id uuid,
  produto_nome text not null,
  ref text,
  fornecedor text,
  qtd integer not null,
  preco numeric not null,
  constraint cotacao_itens_pkey PRIMARY KEY (id),
  constraint cotacao_itens_cotacao_id_fkey FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE
);

create table if not exists public.pedidos (
  id uuid not null default gen_random_uuid(),
  numero text,
  cliente_nome text not null,
  fornecedor text,
  status text default 'aberto'::text,
  data date default CURRENT_DATE,
  criado_em timestamp with time zone default now(),
  vencimento date,
  transportadora text,
  recebido boolean default false,
  recebido_em date,
  constraint pedidos_pkey PRIMARY KEY (id)
);

create table if not exists public.pedido_itens (
  id uuid not null default gen_random_uuid(),
  pedido_id uuid,
  produto_nome text not null,
  ref text,
  fornecedor text,
  qtd integer not null,
  preco numeric not null,
  custo numeric,
  constraint pedido_itens_pkey PRIMARY KEY (id),
  constraint pedido_itens_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

create table if not exists public.parcelas (
  id uuid not null default gen_random_uuid(),
  pedido_id uuid,
  numero integer,
  total integer,
  vencimento date,
  valor numeric not null default 0,
  comissao numeric not null default 0,
  recebido boolean default false,
  recebido_em date,
  criado_em timestamp with time zone default now(),
  constraint parcelas_pkey PRIMARY KEY (id),
  constraint parcelas_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

create table if not exists public.lancamentos (
  id uuid not null default gen_random_uuid(),
  descricao text,
  cliente_nome text,
  valor numeric not null default 0,
  comissao numeric not null default 0,
  vencimento date,
  recebido boolean default false,
  recebido_em date,
  criado_em timestamp with time zone default now(),
  pedido_numero text,
  constraint lancamentos_pkey PRIMARY KEY (id)
);

create table if not exists public.push_subs (
  id uuid not null default gen_random_uuid(),
  endpoint text,
  p256dh text,
  auth text,
  criado_em timestamp with time zone default now(),
  constraint push_subs_pkey PRIMARY KEY (id),
  constraint push_subs_endpoint_key UNIQUE (endpoint)
);

-- RLS ligado em todas as tabelas
alter table public.fornecedores enable row level security;
alter table public.produtos enable row level security;
alter table public.produto_faixas enable row level security;
alter table public.produto_fotos enable row level security;
alter table public.produto_variacoes enable row level security;
alter table public.clientes enable row level security;
alter table public.cotacoes enable row level security;
alter table public.cotacao_itens enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.parcelas enable row level security;
alter table public.lancamentos enable row level security;
alter table public.push_subs enable row level security;

-- Permissões padrão do Supabase (o RLS acima é quem de fato protege as linhas).
-- Incluído porque projetos novos podem não conceder acesso automático às tabelas novas.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;

-- Policies das tabelas (mesmos nomes, comando, roles, using e check do projeto antigo)
drop policy if exists "catalogo leitura publica" on public.fornecedores;
create policy "catalogo leitura publica" on public.fornecedores as permissive for select to public
  using (true);
drop policy if exists "logado gerencia" on public.fornecedores;
create policy "logado gerencia" on public.fornecedores as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "catalogo leitura publica" on public.produtos;
create policy "catalogo leitura publica" on public.produtos as permissive for select to public
  using (true);
drop policy if exists "logado gerencia" on public.produtos;
create policy "logado gerencia" on public.produtos as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "faixas leitura publica" on public.produto_faixas;
create policy "faixas leitura publica" on public.produto_faixas as permissive for select to public
  using (true);
drop policy if exists "faixas logado" on public.produto_faixas;
create policy "faixas logado" on public.produto_faixas as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "catalogo leitura publica" on public.produto_fotos;
create policy "catalogo leitura publica" on public.produto_fotos as permissive for select to public
  using (true);
drop policy if exists "logado gerencia" on public.produto_fotos;
create policy "logado gerencia" on public.produto_fotos as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "catalogo leitura publica" on public.produto_variacoes;
create policy "catalogo leitura publica" on public.produto_variacoes as permissive for select to public
  using (true);
drop policy if exists "logado gerencia" on public.produto_variacoes;
create policy "logado gerencia" on public.produto_variacoes as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "cliente se cadastra" on public.clientes;
create policy "cliente se cadastra" on public.clientes as permissive for insert to anon
  with check (true);
drop policy if exists "logado faz tudo" on public.clientes;
create policy "logado faz tudo" on public.clientes as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "envia cotacao" on public.cotacoes;
create policy "envia cotacao" on public.cotacoes as permissive for insert to anon
  with check (true);
drop policy if exists "logado faz tudo" on public.cotacoes;
create policy "logado faz tudo" on public.cotacoes as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "envia itens da cotacao" on public.cotacao_itens;
create policy "envia itens da cotacao" on public.cotacao_itens as permissive for insert to anon
  with check (true);
drop policy if exists "logado faz tudo" on public.cotacao_itens;
create policy "logado faz tudo" on public.cotacao_itens as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "logado faz tudo" on public.pedidos;
create policy "logado faz tudo" on public.pedidos as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "logado faz tudo" on public.pedido_itens;
create policy "logado faz tudo" on public.pedido_itens as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "logado faz tudo" on public.parcelas;
create policy "logado faz tudo" on public.parcelas as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "logado faz tudo" on public.lancamentos;
create policy "logado faz tudo" on public.lancamentos as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);
drop policy if exists "logado push" on public.push_subs;
create policy "logado push" on public.push_subs as permissive for all to public
  using ((auth.role() = 'authenticated'::text))
  with check (true);

-- Bucket de fotos (público)
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
  on conflict (id) do update set public = excluded.public;

-- Policies do storage.objects
drop policy if exists "fotos leitura publica" on storage.objects;
create policy "fotos leitura publica" on storage.objects as permissive for select to public
  using ((bucket_id = 'produtos'::text));
drop policy if exists "fotos logado atualiza" on storage.objects;
create policy "fotos logado atualiza" on storage.objects as permissive for update to authenticated
  using ((bucket_id = 'produtos'::text));
drop policy if exists "fotos logado envia" on storage.objects;
create policy "fotos logado envia" on storage.objects as permissive for insert to authenticated
  with check ((bucket_id = 'produtos'::text));

