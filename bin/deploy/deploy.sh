#!/bin/bash
set -e

if [ -z "$DEPLOY_USER" ]; then
  echo "Missing DEPLOY_USER"
  exit 1
fi

if [ -z "$DEPLOY_HOST" ]; then
  echo "Missing DEPLOY_HOST"
  exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
  echo "Missing DEPLOY_PATH"
  exit 1
fi

if [ -z "$DEPLOY_ENV_FILE" ] || [ ! -f "$DEPLOY_ENV_FILE" ]; then
  echo "Missing or invalid DEPLOY_ENV_FILE: '$DEPLOY_ENV_FILE'"
  exit 1
fi

REMOTE_USER="$DEPLOY_USER"
REMOTE_HOST="$DEPLOY_HOST"
REMOTE_PROJECT_DIR="$DEPLOY_PATH"
UPDATE_SCRIPT="bin/deploy/update.sh"
APP_ENV_PATH="$REMOTE_PROJECT_DIR/.env.production"

echo "[DEPLOY] Uploading environment file..."
ssh "$REMOTE_USER@$REMOTE_HOST" \
  "mkdir -p '$(dirname "$APP_ENV_PATH")' && cat > '$APP_ENV_PATH'" < "$DEPLOY_ENV_FILE"
echo "[DEPLOY] Environment file uploaded."

echo "[DEPLOY] Running remote deployment script..."
ssh "$REMOTE_USER@$REMOTE_HOST" \
  "REMOTE_PROJECT_DIR='$REMOTE_PROJECT_DIR' DEPLOY_BRANCH='${DEPLOY_BRANCH:-main}' bash -s" < "$UPDATE_SCRIPT"
