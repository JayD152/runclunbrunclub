#!/bin/sh

echo "🔄 Running database migrations..."
npx prisma db push --skip-generate

echo "🚀 Starting RUNCLUB server..."
node server.js
