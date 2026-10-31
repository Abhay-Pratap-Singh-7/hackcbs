#!/usr/bin/env bash
set -euo pipefail

# Load GITHUB_TOKEN from .env if present
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # Source .env safely ignoring comments and blank lines
  [ -s "$PROJECT_DIR/.env" ] && . "$PROJECT_DIR/.env"
  set +a
fi

REPO_URL="https://github.com/Abhay-Pratap-Singh-7/SIH-26.git"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  AUTH_REPO_URL="https://${GITHUB_TOKEN}@github.com/Abhay-Pratap-Singh-7/SIH-26.git"
else
  AUTH_REPO_URL="$REPO_URL"
fi

CACHE_DIR="/tmp/sih26_cache"
STATE_FILE="$PROJECT_DIR/.last_sih26_frontend_commit"

MEKO_API_KEY="mko_tkn_xhuf5o37rkvhjkuq5wjgjabc3h42qrd3itvhgoq"
DATAPACK_ID="18666721-2dd5-4d14-8e0d-bbbe30a3287b"
CONVERSATION_ID="ab94b3dcc3914fa59caa6c17aa52e626"
AGENT_ID="antigravity:hackcbs"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Checking SIH-26 /frontend for updates..."

GIT_TERMINAL_PROMPT=0
export GIT_TERMINAL_PROMPT

if [ ! -d "$CACHE_DIR/.git" ]; then
  rm -rf "$CACHE_DIR"
  if ! git clone "$AUTH_REPO_URL" "$CACHE_DIR" 2>/dev/null; then
    echo "ERROR: Unable to clone $REPO_URL. Ensure GITHUB_TOKEN is set in .env with repo read access." >&2
    exit 1
  fi
else
  git -C "$CACHE_DIR" fetch origin
  DEFAULT_BRANCH=$(git -C "$CACHE_DIR" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
  git -C "$CACHE_DIR" reset --hard "origin/$DEFAULT_BRANCH"
fi

# Get the latest commit affecting /frontend (or root HEAD if no /frontend yet)
if git -C "$CACHE_DIR" log -n 1 --format="%H" -- frontend 2>/dev/null | grep -q .; then
  LATEST_COMMIT=$(git -C "$CACHE_DIR" log -n 1 --format="%H" -- frontend)
  LATEST_MSG=$(git -C "$CACHE_DIR" log -n 1 --format="%s" "$LATEST_COMMIT")
else
  LATEST_COMMIT=$(git -C "$CACHE_DIR" rev-parse HEAD)
  LATEST_MSG=$(git -C "$CACHE_DIR" log -n 1 --format="%s" HEAD)
fi

LAST_COMMIT=""
if [ -f "$STATE_FILE" ]; then
  LAST_COMMIT=$(cat "$STATE_FILE")
fi

if [ "$LATEST_COMMIT" = "$LAST_COMMIT" ]; then
  echo "No new commit in /frontend. Current commit: $LATEST_COMMIT."
  exit 0
fi

echo "New commit found: $LATEST_COMMIT ($LATEST_MSG)"

mkdir -p "$PROJECT_DIR/frontend"
if [ -d "$CACHE_DIR/frontend" ]; then
  rsync -av --delete --exclude=".git" "$CACHE_DIR/frontend/" "$PROJECT_DIR/frontend/"
fi

echo "$LATEST_COMMIT" > "$STATE_FILE"

git -C "$PROJECT_DIR" add frontend/ .last_sih26_frontend_commit
if ! git -C "$PROJECT_DIR" diff --cached --quiet; then
  git -C "$PROJECT_DIR" commit -m "Sync /frontend from SIH-26: $LATEST_MSG ($LATEST_COMMIT)"
  echo "Committed update to repository."
fi

# Persist memory to Meko
MEMORY_TEXT="Synced SIH-26 /frontend commit $LATEST_COMMIT ('$LATEST_MSG') to HackCBS repository and created local commit."

curl -s -X POST https://mcp.mekodata.ai/mcp \
  -H "Authorization: Bearer $MEKO_API_KEY" \
  -H "User-Agent: meko-mcp-installer/1.0" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"memory_add\",\"arguments\":{\"text\":\"$MEMORY_TEXT\",\"conversation_id\":\"$CONVERSATION_ID\",\"agent_id\":\"$AGENT_ID\",\"datapack_id\":\"$DATAPACK_ID\"}}}" > /dev/null

echo "Update memory saved to Meko successfully."
