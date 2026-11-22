#!/bin/sh
set -e

echo "==> Applying database schema..."
npx prisma db push --skip-generate --accept-data-loss=false

echo "==> Starting FitPlan..."
exec node server.js
