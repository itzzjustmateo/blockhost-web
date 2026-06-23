# BlockHost Backend — Setup Requirements

## Environment Variables

Copy `.env.local` (already exists) and fill in:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL — Auth / Users / Subscriptions DB |
| `SERVERS_DATABASE_URL` | Yes | — | PostgreSQL — Servers / Backups / Job History DB |
| `REDIS_CACHE_URL` | Yes | — | Redis — Auth cache, live server state, Pub/Sub (see "Redis Instances" below) |
| `REDIS_BACKGROUND_URL` | Yes | — | Redis — BullMQ queues, rate limiting (see "Redis Instances" below) |
| `BETTER_AUTH_URL` | Yes | — | Public URL of the app (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Yes | — | Secret for signing auth tokens |
| `BACKEND_PORT` | No | `3001` | ElysiaJS API server port |
| `BACKEND_HOST` | No | `0.0.0.0` | ElysiaJS API server host |
| `SERVER_STATUS_TTL` | No | `60` | TTL in seconds for cached server status in Redis |
| `BULLMQ_PREFIX` | No | `blockhost` | Redis key prefix for BullMQ queues |

## PostgreSQL — Two Databases

### DB 1: Users (`DATABASE_URL`)
Auth, subscriptions, and user data. Source of truth for:

| Table | Purpose |
|-------|---------|
| `user`, `session`, `account`, `verification` | Better Auth tables |
| `subscription_plan`, `subscription` | Billing plans and per-user subscription state |

### DB 2: Servers (`SERVERS_DATABASE_URL`)
Server infrastructure, backups, and job history.

| Table | Purpose |
|-------|---------|
| `server_status` | Metadata per Minecraft server (name, version, owner, online state) |
| `backup` | Server backup snapshot metadata |
| `job_history` | Final state of every background job (provision, control, maintenance) |

> `user_id` columns in the Servers DB are plain text (no FK constraint) because foreign keys cannot span PostgreSQL databases. Referential integrity is enforced by the application layer.

## Redis — Two Instances

### Instance 1: Cache (`REDIS_CACHE_URL`)
Fast-changing state and real-time communication.

| Logical DB | Purpose |
|-----------|---------|
| 0 | Auth session cache, user lookup cache |
| 1 | Live Minecraft server state (online, players, TPS, CPU/RAM, heartbeat) |
| 4 | Pub/Sub channels for WebSocket broadcast (server events, job events) |

### Instance 2: Background (`REDIS_BACKGROUND_URL`)
Background processing and rate limiting.

| Logical DB | Purpose |
|-----------|---------|
| 2 | BullMQ job queues (provision, control, maintenance) |
| 3 | IP + user rate limiting (sliding window) |

## Architecture

```
TanStack Start (port 3000)
  │
  ├── /api/auth/*       → Better Auth handler
  ├── /api/*             → ElysiaJS (catch-all at src/routes/api.$.ts)
  │                        │
  │                        ├── services → business logic
  │                        ├── repositories → Drizzle ORM
  │                        │   ├── server/backup/job repos → servers-db (PostgreSQL #2)
  │                        │   └── subscription repo      → db      (PostgreSQL #1)
  │                        ├── cache → Redis Cache Instance
  │                        ├── queues → BullMQ (Redis Background Instance, DB 2)
  │                        └── websocket → WS gateway (Redis Cache Instance, DB 4 pub/sub)
  │
  └── /ws                → WebSocket (live dashboard updates)

BullMQ Workers (separate process, uses Redis Background Instance)
  ├── server-provision
  ├── server-control
  └── server-maintenance
```

## Local Dev Setup (Docker)

```bash
# Start PostgreSQL (×2) + Redis (×2)
docker compose -f config/docker-compose.yml up -d

# Generate auth secret (already set in .env.local, re-run if needed)
bunx @better-auth/cli secret

# Generate + push schema for BOTH databases
bun run db:generate
bun run db:push

# Start dev server + database studio
bun run dev:all

# Start backend API + workers separately (hot reload)
bun run backend:dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite dev server on port 3000 |
| `bun run dev:all` | Dev server + Drizzle Studio (Go dashboard) |
| `docker compose -f config/docker-compose.yml up -d` | Start 2× PG + 2× Redis for local dev |
| `docker compose -f config/docker-compose.yml down` | Stop all containers |
| `bun run backend:dev` | ElysiaJS API + BullMQ workers (Bun --watch) |
| `bun run backend:start` | Start backend once |
| `bun run backend:workers` | BullMQ workers only |
| `bun run build` | Production build |
| `bun run db:push` | Push Drizzle schemas to both databases |
| `bun run db:push:users` | Push only the Users DB schema |
| `bun run db:push:servers` | Push only the Servers DB schema |
| `bun run db:generate` | Generate Drizzle migrations for both databases |
| `bun run lint` | Check lint/format with Biome |
| `bun run lint:fix` | Fix lint/format issues |
| `bun run typecheck` | TypeScript type checking |

## Dependencies Added for Backend

- `elysia` + `@elysiajs/cors` — API framework (Elysia 1.x has built-in WebSocket)
- `ioredis` — Redis client (two separate instances)
- `bullmq` — Background job queues
- `nuqs` — URL query state for React
