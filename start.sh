#!/bin/sh

# If TURSO_DATABASE_URL is set, use Turso (remote libSQL) — otherwise fall back to local SQLite volume
if [ -n "$TURSO_DATABASE_URL" ]; then
  export DATABASE_URL="$TURSO_DATABASE_URL"
  echo "Using Turso database: $DATABASE_URL"
else
  # Ensure the local volume data directory exists
  mkdir -p /data
  export DATABASE_URL="${DATABASE_URL:-file:/data/spotid.db}"
  echo "Using local SQLite: $DATABASE_URL"
fi

echo "=== SpotId Startup ==="
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"

# Run Prisma migrations — log failure but don't abort so we can see the error
echo "Running database migrations..."
npx prisma migrate deploy
MIGRATE_EXIT=$?
if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "WARNING: prisma migrate deploy exited with code $MIGRATE_EXIT"
fi

echo "Starting Next.js..."
exec npm start
