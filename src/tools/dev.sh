#!/usr/bin/env bash
set -e

# BlockHost Dev — runs dev server + DB Studio via concurrently

bun x concurrently \
  -n "dev,studio" \
  -c "cyan,magenta" \
  "bun run dev" \
  "bun run db:studio"
