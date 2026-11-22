#!/bin/sh
set -e

echo "==> Applying database schema..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "==> Seeding admin account..."
node ./scripts/seed-admin.mjs || echo "==> Admin seed skipped or failed (non-fatal)"

echo "==> Starting FitPlan..."
exec node server.js
