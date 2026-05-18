#!/bin/sh
set -e

DB_PATH="/app/prisma/dev.db"
SCHEMA_SRC="/app/schema.prisma"
SCHEMA_DST="/app/prisma/schema.prisma"

echo "=== AthEnglish Deployment ==="

# Copy schema.prisma into the volume (volume mount hides Dockerfile COPY)
if [ -f "$SCHEMA_SRC" ]; then
  cp "$SCHEMA_SRC" "$SCHEMA_DST"
  echo "[OK] Schema copied to volume"
fi

# Check if database exists
if [ -f "$DB_PATH" ]; then
  echo "[OK] Found existing database, preserving all data"
else
  echo "[INIT] No database found. Creating empty database..."
fi

# Push schema
echo "[RUN] prisma db push..."
npx prisma db push --schema="$SCHEMA_DST" --skip-generate

echo "[READY] Starting Next.js..."
exec npm start
