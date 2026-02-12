#!/bin/bash
set -e

# Run SSH setup in the current shell (so ssh-agent stays alive)
source bin/staging/setup-ssh.dev.sh

# Determine environment based on branch
REMOTE_USER="$STAGING_USER"
REMOTE_HOST="$STAGING_HOST"
ENV_FILE="$STAGING_ENV_FILE"
REMOTE_PROJECT_DIR="$STAGING_PATH"
UPDATE_SCRIPT="bin/staging/update.dev.sh"
APP_ENV_PATH="$REMOTE_PROJECT_DIR/.env.production"

# Upload environment contents to the target server
echo "[DEPLOY] Uploading environment files..."
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p '$(dirname "$APP_ENV_PATH")' && cat > '$APP_ENV_PATH'" < "$ENV_FILE"
echo "[DEPLOY] .env files uploaded successfully."

# Run the remote script
echo "[CI] Running remote deployment script..."
ssh "$REMOTE_USER@$REMOTE_HOST" \
  "REMOTE_PROJECT_DIR='$REMOTE_PROJECT_DIR' bash -s" < "$UPDATE_SCRIPT"

