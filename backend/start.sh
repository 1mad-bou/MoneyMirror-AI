#!/bin/sh
set -e

echo "Applying database migrations..."
cd /app/api
attempt=0
until alembic -c alembic.ini upgrade head; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 10 ]; then
    echo "Migrations failed after $attempt attempts" >&2
    exit 1
  fi
  echo "Database not ready yet, retrying in 3s ($attempt/10)..."
  sleep 3
done
cd /app

if [ "${UVICORN_RELOAD:-false}" = "true" ]; then
  exec uvicorn asgi:api --host 0.0.0.0 --port 8000 --reload --reload-dir /app/api
else
  exec uvicorn asgi:api --host 0.0.0.0 --port 8000
fi

