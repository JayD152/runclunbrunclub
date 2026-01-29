#!/bin/sh
set -e

echo "🔄 Running database migrations..."
prisma db push --accept-data-loss

echo "✅ Database ready!"
echo "🚀 Starting RUNCLUB server..."
exec node server.js
