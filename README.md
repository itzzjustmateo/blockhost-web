<p align="center">
    <img alt="header" src="https://shieldcn.dev/header/gradient.svg?title=BlockHost&amp;subtitle=A+free+Minecraft+server+hosting+platform+that+allows+users+to+create+and+manage+their+own+servers+easily.&amp;mode=dark&amp;image=https%3A%2F%2Fcdn.modrinth.com%2Fdata%2FQ1npqj0w%2Fimages%2F5994e47ff0921a85cac7ad82471657626211acb7_350.webp" width="100%"/>
</p>

<p align="center">
  <img alt="GitHub License" src="https://shieldcn.dev/github/license/itzzjustmateo/blockhost-web" />
  <img alt="Built with" src="https://shieldcn.dev/badge/Built%20with-TanStack%20Start-9cf?logo=react" />
  <img alt="TypeScript" src="https://shieldcn.dev/badge/TypeScript-3178C6?logo=typescript&amp;logoColor=white" />
  <img alt="Tailwind CSS" src="https://shieldcn.dev/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&amp;logoColor=white" />
</p>

## BlockHost

A modern, responsive Minecraft server hosting platform built with **TanStack Start**. Launch and manage Minecraft servers through an intuitive dashboard with support for mods, plugins, automatic backups, and more.

### Pages

| Route       | Description                                        |
|-------------|----------------------------------------------------|
| `/`         | Landing page with hero, features, and stats        |
| `/pricing`  | Pricing plans with comparison table                |
| `/login`    | Sign in to your BlockHost account                  |
| `/signup`   | Create a new BlockHost account                     |

### Tech Stack

| Layer          | Technology                                                           |
|----------------|----------------------------------------------------------------------|
| Framework      | [TanStack Start](https://tanstack.com/start) (React 19 + Vite)      |
| Routing        | [TanStack Router](https://tanstack.com/router) (file-based)         |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com) + CSS custom properties  |
| UI Components  | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) |
| Icons          | [Lucide React](https://lucide.dev/)                                 |
| Auth           | [Better Auth](https://www.better-auth.com) (email/password)         |
| Database       | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team)              |
| Animations     | `tw-animate-css` + custom CSS animations                            |
| i18n           | [Paraglide JS](https://inlang.com/paraglide) (EN/DE)                |

### Features

- **Modern Landing Page** — Hero section with interactive dashboard mockup, feature cards with hover animations, stats section, and call-to-action
- **Pricing Page** — Four pricing cards (Free, Premium, Pro, Enterprise) with a side-by-side comparison table
- **Authentication** — Login and signup with Better Auth (email/password), persisted sessions
- **Dark Mode** — System-first dark mode with manual toggle, respects `prefers-color-scheme`
- **Responsive Design** — Mobile-first layout with collapsible navigation
- **Page Transitions** — Smooth fade animations between route changes
- **Custom Design System** — Vercel-inspired black/white minimal theme with Fraunces display font and Manrope sans-serif

### Getting Started

```bash
# Install dependencies
bun install

# Generate Better Auth secret
bunx @better-auth/cli secret

# Set up environment variables
cp .env.example .env.local

# Generate Drizzle migrations
bun run db:generate

# Push schema to database (requires database access)
bun run db:push

# Start development server
bun run dev
```

Visit `http://localhost:3000` in your browser.

### Database

The project uses PostgreSQL with Drizzle ORM. The Better Auth authentication tables (`user`, `session`, `account`, `verification`) are defined in `src/db/auth-schema.ts`.

To apply migrations when you have database access:

```bash
bun run db:push
```

If `db:push` fails with `ENOTFOUND`, the database hostname is an internal container name that isn't resolvable from your current network. Run the command from within the same Docker/Kubernetes network as the database, or use a tunnel/port-forward.

### Build

```bash
bun run build
```

The output is a self-contained Nitro server in `.output/`.

### Project Structure

```
src/
├── components/ui/        # shadcn UI components
├── db/
│   ├── index.ts          # Drizzle database client
│   ├── schema.ts         # Todo table schema
│   └── auth-schema.ts    # Better Auth table schema
├── lib/
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth browser client
│   └── utils.ts          # cn() utility
├── routes/
│   ├── __root.tsx        # Root layout (head, scripts)
│   ├── _layout.tsx       # Main layout (header, footer)
│   ├── _layout/
│   │   ├── index.tsx     # Landing page
│   │   ├── pricing.tsx   # Pricing page
│   │   ├── login.tsx     # Login page
│   │   └── signup.tsx    # Signup page
│   └── api/auth/$.ts     # Better Auth API handler
├── integrations/         # TanStack Query, Better Auth
└── styles.css            # Global styles + design tokens
```
