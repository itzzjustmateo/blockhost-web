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
| `BLOCKHOST_SERVERS_DIR` | No | `/tmp/blockhost-servers` | Directory for MC server data files (mounted into Docker) |
| — | — | — | Cloudflare creds provided at runtime via UI (see "Cloudflare DNS Integration" below) |

## Docker Integration

### Services

| Service | Container Name | Host Port | Internal |
|---------|---------------|-----------|----------|
| `postgres-users` | `blockhost-postgres-users` | 5432 | 5432 |
| `postgres-servers` | `blockhost-postgres-servers` | 5434 | 5432 |
| `redis-cache` | `blockhost-redis-cache` | 6379 | 6379 |
| `redis-background` | `blockhost-redis-background` | 6380 | 6379 |
| `app` | `blockhost-app` | 3000 | 3000 |

### Networks

- **`blockhost`** — bridge network for infrastructure services (PG, Redis) and the app
- **`blockhost-mc`** — bridge network for MC server containers (managed dynamically by `docker.service.ts`)

### MC Server Containers

Each Minecraft server runs in its own Docker container:
- Image: `openjdk:21-jre-slim`
- Network: `blockhost-mc` (isolated from infrastructure)
- Port: host port `<assigned_port>` : container port `25565` (TCP + UDP)
- Volume: `BLOCKHOST_SERVERS_DIR/<serverId>:/server` (jars, configs, worlds)
- Container name: `blockhost-mc-<serverId>`
- Labels: `blockhost-server-id`, `blockhost-server-name`

### Docker Socket

The app container requires access to the Docker socket (`/var/run/docker.sock`) to manage MC server containers. This is mounted read-write in the docker-compose config.

### Backend Service

`src/backend/services/docker.service.ts` — wraps Docker CLI commands via `child_process.execSync`:
- `provisionServer()` — creates and starts a new MC server container
- `stopServer()` / `startServer()` / `restartServer()` — container lifecycle
- `removeServer()` — deletes the container
- `isServerRunning()` — checks container state
- `getServerLogs()` — fetches container logs

## Cloudflare DNS Integration

BlockHost can automatically configure DNS records for external domains via the Cloudflare API.

### How it works

1. User enters an external domain (not `*.siuuuhd.de`) in the Create Server modal
2. User clicks "Configure" and provides their Cloudflare API Token + Zone ID
3. Backend verifies the token via `GET /user/tokens/verify`
4. Backend creates DNS records on the user's Cloudflare zone:
   - **A record** (`@`) pointing `185.234.72.18` (proxied)
   - **CNAME record** (subdomain) pointing to `@` (proxied) — only if the domain has a subdomain
5. On success, the UI shows a green confirmation

### API Token Requirements

The token needs the `DNS:Edit` permission for the zone. Generate one at:
`https://dash.cloudflare.com/profile/api-tokens` → "Create Token" → "Edit DNS Zones" template.

### API Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/servers/cloudflare-dns` | Create DNS records; body: `{ apiToken, zoneId, domain }` |

### Backend Service

`src/backend/services/cloudflare.service.ts` — wraps the Cloudflare v4 API:
- `verifyToken(apiToken)` — validates the API token
- `addDnsRecords(apiToken, zoneId, domain, ip)` — creates A + CNAME records

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
TanStack Start (port 3000, inside Docker)
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
  │                        ├── websocket → WS gateway (Redis Cache Instance, DB 4 pub/sub)
  │                        └── docker.service → Docker socket (MC server containers)
  │
  └── /ws                → WebSocket (live dashboard updates)

BullMQ Workers (separate process, uses Redis Background Instance)
  ├── server-provision
  ├── server-control
  └── server-maintenance

MC Server Containers (running on blockhost-mc network)
  ├── blockhost-mc-<serverId> → openjdk:21-jre-slim, port mapped to host
  ├── blockhost-mc-<serverId> → ...
  └── ...
```

## Local Dev Setup (Docker)

```bash
# Start all services (PG ×2, Redis ×2, app)
docker compose -f config/docker-compose.yml up -d

# Watch app logs
docker compose -f config/docker-compose.yml logs -f app

# Generate auth secret (already set in .env.local, re-run if needed)
bunx @better-auth/cli secret

# Generate + push schema for BOTH databases
docker compose -f config/docker-compose.yml exec app bun run db:push

# Restart app after schema push
docker compose -f config/docker-compose.yml restart app
```

### Running outside Docker (legacy)

If you prefer to run the app directly on your host (without the app container):

```bash
# Start only infrastructure services
docker compose -f config/docker-compose.yml up -d postgres-users postgres-servers redis-cache redis-background

# Start dev server
bun run dev

# Push schemas
bun run db:push
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite dev server on port 3000 |
| `bun run build` | Production build |
| `docker compose -f config/docker-compose.yml up -d` | Start all services (2× PG + 2× Redis + app) |
| `docker compose -f config/docker-compose.yml down` | Stop all containers |
| `docker compose -f config/docker-compose.yml logs -f app` | Watch app logs |
| `docker compose -f config/docker-compose.yml up -d app` | Start only the app container |
| `docker compose -f config/docker-compose.yml exec app bun run db:push` | Push Drizzle schemas to both databases |
| `docker compose -f config/docker-compose.yml restart app` | Restart the app container |
| `bun run lint` | Check lint/format with Biome |
| `bun run lint:fix` | Fix lint/format issues |
| `bun run typecheck` | TypeScript type checking |

## Dependencies Added for Backend

- `elysia` + `@elysiajs/cors` — API framework (Elysia 1.x has built-in WebSocket)
- `ioredis` — Redis client (two separate instances)
- `bullmq` — Background job queues
- `nuqs` — URL query state for React
