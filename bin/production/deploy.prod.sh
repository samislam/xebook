#!/bin/bash
set -e

# Run SSH setup in the current shell (so ssh-agent stays alive)
source bin/production/setup-ssh.prod.sh

# Determine environment based on branch
REMOTE_USER="$PROD_USER"
REMOTE_HOST="$PROD_HOST"
ENV_FILE="$PROD_ENV_FILE"
REMOTE_PROJECT_DIR="$PROD_PATH"
UPDATE_SCRIPT="bin/production/update.prod.sh"
APP_ENV_PATH="$REMOTE_PROJECT_DIR/.env.production"

# Upload environment contents to the target server
echo "[DEPLOY] Uploading environment files..."
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p '$(dirname "$APP_ENV_PATH")' && cat > '$APP_ENV_PATH'" < "$ENV_FILE"
echo "[DEPLOY] .env files uploaded successfully."

# Run the remote script
echo "[CI] Running remote deployment script..."
ssh "$REMOTE_USER@$REMOTE_HOST" \
  "REMOTE_PROJECT_DIR='$PROD_PATH' bash -s" < "$UPDATE_SCRIPT"

