#!/usr/bin/env bash
set -euo pipefail

DB_BINDING_OR_NAME="${1:-deanflow-db}"
MODE="${2:---remote}"
OUT_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${OUT_DIR}/${DB_BINDING_OR_NAME}-${TIMESTAMP}.sql"

mkdir -p "$OUT_DIR"

echo "Exporting Cloudflare D1 database '${DB_BINDING_OR_NAME}' (${MODE})..."
npx wrangler d1 export "$DB_BINDING_OR_NAME" "$MODE" --output "$OUT_FILE"

if [ ! -s "$OUT_FILE" ]; then
  echo "Backup failed: exported SQL file is empty (${OUT_FILE})" >&2
  exit 1
fi

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$OUT_FILE" > "${OUT_FILE}.sha256"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$OUT_FILE" > "${OUT_FILE}.sha256"
fi

echo "Backup created: ${OUT_FILE}"
if [ "$MODE" = "--remote" ]; then
  echo "Recording current D1 Time Travel bookmark..."
  npx wrangler d1 time-travel info "$DB_BINDING_OR_NAME" || true
fi

