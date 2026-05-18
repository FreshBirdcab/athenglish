#!/bin/sh
set -e

DB_PATH="/app/prisma/dev.db"

echo "=== AthEnglish Deployment ==="

# Check if database exists (from persistent volume)
if [ -f "$DB_PATH" ]; then
  echo "[OK] Found existing database, preserving all data"
else
  echo "[INIT] No database found. Creating empty database from schema..."
fi

# Always push schema (safe - only adds missing tables/columns)
echo "[RUN] prisma db push..."
npx prisma db push --skip-generate

echo "[READY] Starting Next.js..."
exec npm start
