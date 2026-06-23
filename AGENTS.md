# BlockHost Web Remake

A modern Minecraft server hosting platform built with TanStack Start.

## Tech Stack

- **Framework**: TanStack Start (React 19, Vite, SSR)
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + custom design tokens
- **UI**: shadcn/ui + Radix UI
- **Auth**: Better Auth (email/password, Drizzle adapter)
- **Database**: PostgreSQL via Drizzle ORM
- **Linting**: Biome via Ultracite (run `bun x ultracite fix` before committing)
- **Git Hooks**: Husky (pre-commit runs `ultracite fix`)

## Quick Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Build for production |
| `bun run test` | Run Vitest tests |
| `bun run db:push` | Push Drizzle schema to database |
| `bun run generate-routes` | Regenerate TanStack Router routes |
| `bun run lint:fix` | Format and lint all files |
| `bun run lint:check` | Check for lint/format issues |
| `docker compose -f config/docker-compose.yml up -d` | Start all services (PG ×2, Redis ×2, app) |
| `docker compose -f config/docker-compose.yml up -d app` | Start only the app (after deps are up) |
| `docker compose -f config/docker-compose.yml logs -f app` | Watch app logs |

## Project Structure

```
src/
├── routes/            # File-based routes (TanStack Router)
│   ├── _layout.tsx    # Main layout (header, footer, nav)
│   ├── _layout/       # Pages using the layout
│   └── api/           # API routes (auth)
├── components/        # Shared components
│   └── ui/            # shadcn/ui primitives
├── db/                # Drizzle schema + client
├── lib/               # Auth client/server, utilities
└── styles.css         # Global styles + design tokens
```

## Routes

| Path | File | Description |
|------|------|-------------|
| `/` | `_layout/index.tsx` | Landing page |
| `/pricing` | `_layout/pricing.tsx` | Pricing plans |
| `/login` | `_layout/login.tsx` | Sign in |
| `/signup` | `_layout/signup.tsx` | Register |

## Design

Vercel-inspired black/white minimal theme. System-first dark mode (respects `prefers-color-scheme`). Fraunces display font, Manrope body font.
