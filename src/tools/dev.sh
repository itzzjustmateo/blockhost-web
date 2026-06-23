#!/usr/bin/env bash
set -e

# BlockHost Dev Dashboard
# Has a TUI via Go, falls back to concurrently if Go isn't available

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_concurrently() {
  echo "╔══════════════════════════════════════╗"
  echo "║   BlockHost Development Dashboard   ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
  echo "  Go not found. Using concurrently as fallback."
  echo ""
  # Always use bun x for the npx runner
  bun x concurrently \
    -n "dev,studio" \
    -c "cyan,magenta" \
    "bun run dev" \
    "bun run db:studio"
}

# Step 1: try Go for the proper TUI
if command -v go &>/dev/null; then
  # Go 1.22+ supports -C flag to change directory before running
  if go version | grep -qP 'go1\.(2[2-9]|[3-9]\d)'; then
    exec go run -C "$SCRIPT_DIR/dev" .
  else
    # Older Go — cd into dir first
    exec go run "$SCRIPT_DIR/dev"
  fi
fi

# Step 2: fallback
run_concurrently
