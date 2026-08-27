#!/usr/bin/env bash
set -euo pipefail

# Usage on server:
#   export GITHUB_TOKEN="your_new_token_here"
#   bash scripts/setup-github-auth.sh
#
# Do NOT commit tokens. Revoke any token that was shared in chat.

: "${GITHUB_TOKEN:?Please set GITHUB_TOKEN first}"

GITHUB_USER="${GITHUB_USER:-18507493828}"
REPO="${REPO:-18507493828/skill-store}"

git config --global credential.helper store
printf "https://%s:%s@github.com\n" "$GITHUB_USER" "$GITHUB_TOKEN" > ~/.git-credentials
chmod 600 ~/.git-credentials

if [ -d "skill-store/.git" ]; then
  echo "Directory skill-store already exists. Pulling latest..."
  cd skill-store
  git pull origin main
elif [ -d "skill-store" ]; then
  echo "skill-store exists but is not a git repo. Remove it first:"
  echo "  rm -rf skill-store"
  exit 1
else
  git clone "https://github.com/${REPO}.git"
fi

echo "Done. GitHub HTTPS auth is configured for this server."
