#!/usr/bin/env bash
# Crea una base de datos desechable, aplica el shim de Supabase, todas las
# migraciones en orden y las pruebas. Uso: PGHOST=... PGPORT=... ./supabase/tests/run-local.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="rutine_test_$$"
export PGUSER="${PGUSER:-postgres}"
psql -q -d postgres -c "create database $DB" >/dev/null
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$DIR/tests/shim/supabase_shim.sql" >/dev/null
for f in "$DIR"/migrations/*.sql; do
  echo "migración: $(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null
done
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$DIR/tests/shim/test_helpers.sql" >/dev/null
for f in "$DIR"/tests/*_test.sql; do
  echo "pruebas: $(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" | sed -n '/resultado/,$p'
done
