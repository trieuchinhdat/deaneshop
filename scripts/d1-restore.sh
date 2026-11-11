#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <db-name> <backup.sql> [--local|--remote] [--confirm]" >&2
  echo "Or Time Travel restore: npx wrangler d1 time-travel restore <db-name> --timestamp=<ISO8601>" >&2
  exit 1
fi

DB_NAME="$1"
BACKUP_FILE="$2"
MODE="--local"
CONFIRMED="false"

for arg in "${@:3}"; do
  case "$arg" in
    --local|--remote) MODE="$arg" ;;
    --confirm) CONFIRMED="true" ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Backup file missing or empty: ${BACKUP_FILE}" >&2
  exit 1
fi

if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying SHA-256 checksum..."
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "${BACKUP_FILE}.sha256"
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${BACKUP_FILE}.sha256"
  fi
fi

if [ "$MODE" = "--remote" ] && [ "$CONFIRMED" != "true" ]; then
  echo "Refusing remote D1 restore without --confirm flag." >&2
  exit 1
fi

echo "Restoring '${BACKUP_FILE}' into Cloudflare D1 '${DB_NAME}' (${MODE})..."
npx wrangler d1 execute "$DB_NAME" "$MODE" --file="$BACKUP_FILE" --yes
echo "Restore completed. Verify via GET /api/health and GET /api/admin/health."

