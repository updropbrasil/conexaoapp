-- 001_config_e_fotos.sql — Conexão Vendas v2
-- Rodar UMA vez no SQL Editor do projeto Supabase (pode rodar de novo sem problema: é idempotente).
-- O app funciona mesmo antes de rodar (usa o visual padrão e não apaga fotos antigas do Storage).

-- 1) Aparência do site (banner + tema), editada em Painel › Aparência
create table if not exists public.config (
  chave text primary key,
  valor text,
  atualizado_em timestamptz default now()
);
alter table public.config enable row level security;
grant select on public.config to anon, authenticated;
grant insert, update, delete on public.config to authenticated;

drop policy if exists "config leitura publica" on public.config;
create policy "config leitura publica" on public.config for select to public using (true);

drop policy if exists "config logado altera" on public.config;
create policy "config logado altera" on public.config for all to authenticated using (true) with check (true);

-- 2) Storage: permitir que o representante (logado) APAGUE fotos do bucket "produtos".
--    Sem isso, ao excluir/trocar uma foto o arquivo antigo fica ocupando espaço no Storage.
drop policy if exists "fotos logado apaga" on storage.objects;
create policy "fotos logado apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'produtos');

-- 3) SEGURANÇA: as policies "logado ..." usam WITH CHECK (true). No INSERT só o WITH CHECK vale,
--    então hoje qualquer visitante SEM login consegue INSERIR em produtos, fornecedores, pedidos, parcelas etc.
--    (testado num Postgres local com estas mesmas policies). Aqui o WITH CHECK passa a exigir login.
--    Não muda nada para o representante logado nem para o catálogo público (cotação e cadastro continuam abertos).
alter policy "logado gerencia" on public.fornecedores with check (auth.role() = 'authenticated');
alter policy "logado gerencia" on public.produtos with check (auth.role() = 'authenticated');
alter policy "faixas logado" on public.produto_faixas with check (auth.role() = 'authenticated');
alter policy "logado gerencia" on public.produto_fotos with check (auth.role() = 'authenticated');
alter policy "logado gerencia" on public.produto_variacoes with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.clientes with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.cotacoes with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.cotacao_itens with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.pedidos with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.pedido_itens with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.parcelas with check (auth.role() = 'authenticated');
alter policy "logado faz tudo" on public.lancamentos with check (auth.role() = 'authenticated');
alter policy "logado push" on public.push_subs with check (auth.role() = 'authenticated');

-- Observação: "Fazer pedido" no catálogo é gravado em public.cotacoes com status = 'fechar'
-- (cliente quer fechar o pedido). Não precisa de coluna nova.
