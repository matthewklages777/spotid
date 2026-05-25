#!/bin/sh

# Ensure the data directory exists (Railway volume may not pre-create it)
mkdir -p /data

# Default DATABASE_URL to the volume path if not explicitly set
export DATABASE_URL="${DATABASE_URL:-file:/data/spotid.db}"

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
