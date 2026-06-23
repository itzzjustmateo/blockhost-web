#!/usr/bin/env bash
set -e

# BlockHost Dev TUI — tries Go Bubble Tea dashboard, falls back to dev.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any leftover Drizzle Studio from a previous run
fuser -k 4983/tcp 2>/dev/null || true
fuser -k 4984/tcp 2>/dev/null || true

if command -v go &>/dev/null; then
  if go version | grep -qP 'go1\.(2[2-9]|[3-9]\d)'; then
    exec go run -C "$SCRIPT_DIR/dev" . || exec bash "$SCRIPT_DIR/dev.sh"
  else
    exec go run "$SCRIPT_DIR/dev" . || exec bash "$SCRIPT_DIR/dev.sh"
  fi
fi

exec bash "$SCRIPT_DIR/dev.sh"
