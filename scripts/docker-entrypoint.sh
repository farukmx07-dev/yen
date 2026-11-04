#!/bin/sh
set -e

if [ -n "$MYSQL_HOST" ]; then
  node /app/scripts/wait-for-mysql.js
fi

if [ "$RUN_DB_MIGRATE" = "true" ] && [ -f /app/data/settings.json ]; then
  echo "[entrypoint] JSON -> MySQL migration calistiriliyor..."
  node /app/scripts/migrate-json-to-mysql.js || echo "[entrypoint] Migration atlandi veya zaten yapilmis"
fi

echo "[entrypoint] Uygulama baslatiliyor: $*"
exec "$@" || {
  code=$?
  echo "[entrypoint] Uygulama cikti (code=$code)"
  exit "$code"
}
