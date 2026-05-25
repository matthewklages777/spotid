#!/bin/sh
set -e

# Ensure the data directory exists (Railway volume may not pre-create it)
mkdir -p /data

# Default DATABASE_URL to the volume path if not explicitly set
export DATABASE_URL="${DATABASE_URL:-file:/data/spotid.db}"

echo "Starting SpotId..."
echo "DATABASE_URL: $DATABASE_URL"

# Run Prisma migrations against the real database on the mounted volume
echo "Running database migrations..."
npx prisma migrate deploy

echo "Migrations complete. Starting Next.js..."
exec npm start
