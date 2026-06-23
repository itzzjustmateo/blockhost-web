import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

export const env = {
  port: Number(process.env.BACKEND_PORT) || 3001,
  host: process.env.BACKEND_HOST || "0.0.0.0",

  databaseUrl: process.env.DATABASE_URL as string,
  serversDatabaseUrl: process.env.SERVERS_DATABASE_URL as string,

  redisCacheUrl: process.env.REDIS_CACHE_URL as string,
  redisBackgroundUrl: process.env.REDIS_BACKGROUND_URL as string,

  betterAuth: {
    url: process.env.BETTER_AUTH_URL as string,
    secret: process.env.BETTER_AUTH_SECRET as string,
  },

  bullmq: {
    prefix: process.env.BULLMQ_PREFIX || "blockhost",
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 } as const,
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { age: 3600 * 24 * 7 },
    },
  },

  rateLimit: {
    auth: { windowMs: 60_000, max: 10 },
    serverActions: { windowMs: 60_000, max: 30 },
    general: { windowMs: 60_000, max: 200 },
  },

  serverStatusTtl: Number(process.env.SERVER_STATUS_TTL) || 60,

  isDev: process.env.NODE_ENV !== "production",
} as const;

export function requireEnv() {
  const missing: string[] = [];
  if (!env.databaseUrl) {
    missing.push("DATABASE_URL");
  }
  if (!env.serversDatabaseUrl) {
    missing.push("SERVERS_DATABASE_URL");
  }
  if (!env.redisCacheUrl) {
    missing.push("REDIS_CACHE_URL");
  }
  if (!env.redisBackgroundUrl) {
    missing.push("REDIS_BACKGROUND_URL");
  }
  if (!env.betterAuth.secret) {
    missing.push("BETTER_AUTH_SECRET");
  }
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
