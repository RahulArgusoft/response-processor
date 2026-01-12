#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."
# Wait for database to be available
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
  sleep 1
done
echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting application..."
exec node dist/main
