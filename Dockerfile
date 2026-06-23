FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev"]

FROM base AS build
COPY . .
RUN bun run build

FROM oven/bun:1 AS production
WORKDIR /app
COPY --from=build /app/.output ./output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["bun", "run", "./output/server/index.mjs"]
