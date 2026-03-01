#!/bin/bash
set -e
export CI=true

if [ -z "$REMOTE_PROJECT_DIR" ] || [ ! -d "$REMOTE_PROJECT_DIR" ]; then
  echo "Invalid or missing REMOTE_PROJECT_DIR: '$REMOTE_PROJECT_DIR'"
  exit 1
fi

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

echo "[DEPLOY] Starting deployment..."
cd "$REMOTE_PROJECT_DIR"

echo "[DEPLOY] Fetching clean state..."
git fetch origin "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"
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

echo "[DEPLOY] Done."
