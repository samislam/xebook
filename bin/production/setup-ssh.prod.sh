#!/bin/bash
set -e

SSH_USER_DIR="$HOME/.ssh"
REMOTE_HOST="$PROD_HOST"
KNOWN_HOSTS_FILE="$SSH_USER_DIR/known_hosts"
SSH_PRIVATE_KEY_FILE="$PROD_SSH_PRIVATE_KEY_FILE"

echo "[CI] Setting up SSH agent..."

mkdir -p "$SSH_USER_DIR"
chmod 700 "$SSH_USER_DIR"
chmod 600 "$SSH_PRIVATE_KEY_FILE"

eval "$(ssh-agent -s)"
ssh-add "$SSH_PRIVATE_KEY_FILE"

touch "$KNOWN_HOSTS_FILE"
if ! ssh-keygen -F "$REMOTE_HOST" > /dev/null; then
  ssh-keyscan "$REMOTE_HOST" >> "$KNOWN_HOSTS_FILE"
fi

echo "[CI] SSH setup complete."