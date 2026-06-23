#!/usr/bin/env bash
set -e

# BlockHost Dev — runs dev server + DB Studio via concurrently

# Kill any leftover Drizzle Studio from a previous run
fuser -k 4983/tcp 2>/dev/null || true
fuser -k 4984/tcp 2>/dev/null || true

bun x concurrently \
  -n "dev,studio" \
  -c "cyan,magenta" \
  "bun run dev" \
  "bun run db:studio"
