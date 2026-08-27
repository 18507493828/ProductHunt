#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Pull latest code"
git pull origin main

echo "==> Install dependencies"
npm run install:all

echo "==> Build frontend"
npm run build

echo "==> Restart service"
if pm2 describe product-hunt >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi

pm2 save
echo "==> Deploy finished"
