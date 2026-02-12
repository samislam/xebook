#!/bin/bash
set -e
export CI=true

echo "[DEPLOY] Starting deployment..."

if [ -z "$REMOTE_PROJECT_DIR" ] || [ ! -d "$REMOTE_PROJECT_DIR" ]; then
  echo "Invalid or missing REMOTE_PROJECT_DIR: '$REMOTE_PROJECT_DIR'"
  exit 1
fi

cd "$REMOTE_PROJECT_DIR"

echo "[DEPLOY] Fetching clean state..."
git fetch origin main
git reset --hard origin/main
git clean -fd


echo "[DEPLOY] Installing dependencies..."
bun install --frozen-lockfile

echo "[DEPLOY] Running setup..."
NODE_ENV=production bun run setup

echo "[DEPLOY] Building apps..."
bun run build

echo "[DEPLOY] Waiting before reload..."
sleep 2

echo "[DEPLOY] Reloading PM2..."
pm2 reload ecosystem.config.cjs --update-env

echo "[DEPLOY] Done ✅"
