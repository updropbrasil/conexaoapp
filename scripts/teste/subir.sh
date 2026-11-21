#!/usr/bin/env bash
# Sobe o "Supabase local" de testes: Postgres (já rodando na porta 54329) + PostgREST + gateway.
# Recria o banco "conexao" do zero com a estrutura real (000) + a migração pendente (001).
# Uso: bash scripts/teste/subir.sh   (POSTGREST_BIN=/caminho/postgrest)
set -euo pipefail
cd "$(dirname "$0")/../.."
PG="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-54329} -U postgres -v ON_ERROR_STOP=1 -q"
POSTGREST_BIN=${POSTGREST_BIN:-/home/claude/tools/postgrest}
SEGREDO='segredo-de-teste-com-pelo-menos-32-caracteres!!'
pkill -f "$POSTGREST_BIN" 2>/dev/null || true
pkill -f scripts/teste/gateway.mjs 2>/dev/null || true
$PG -c "drop database if exists conexao with (force)" 2>/dev/null
$PG -c "create database conexao"
$PG -d conexao -f scripts/teste/supabase-local.sql
$PG -d conexao -f supabase/migrations/000_estrutura_atual.sql 2>/dev/null
[ "${SEM_MIGRACAO:-0}" = "1" ] || $PG -d conexao -f supabase/migrations/001_config_e_fotos.sql 2>/dev/null
rm -rf /tmp/conexao-storage && mkdir -p /tmp/conexao-storage
PGRST_DB_URI="postgres://authenticator@127.0.0.1:${PGPORT:-54329}/conexao" PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon \
  PGRST_JWT_SECRET="$SEGREDO" PGRST_SERVER_PORT=54330 PGRST_DB_CHANNEL_ENABLED=false \
  nohup "$POSTGREST_BIN" > /tmp/postgrest.log 2>&1 &
SEGREDO="$SEGREDO" nohup node scripts/teste/gateway.mjs > /tmp/gateway.log 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:54330/ && break; sleep 0.3; done
sleep 0.5
echo "ok: PostgREST :54330, gateway :54321"
