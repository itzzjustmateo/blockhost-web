import Redis from "ioredis";
import { env } from "../config/index.ts";

export const RedisDb = {
  Auth: 0,
  ServerState: 1,
  PubSub: 4,
} as const;

export type RedisDb = (typeof RedisDb)[keyof typeof RedisDb];

export const BackgroundRedisDb = {
  BullMq: 2,
  RateLimit: 3,
} as const;

export type BackgroundRedisDb =
  (typeof BackgroundRedisDb)[keyof typeof BackgroundRedisDb];

const cacheClients = new Map<RedisDb, Redis>();
const backgroundClients = new Map<BackgroundRedisDb, Redis>();

function createCacheClient(db: RedisDb): Redis {
  return new Redis(env.redisCacheUrl, {
    db,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 200, 3000);
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

function createBackgroundClient(db: BackgroundRedisDb): Redis {
  return new Redis(env.redisBackgroundUrl, {
    db,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 200, 3000);
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export function getCacheRedis(db: RedisDb): Redis {
  let client = cacheClients.get(db);
  if (!client) {
    client = createCacheClient(db);
    cacheClients.set(db, client);
  }
  return client;
}

export function getBackgroundRedis(db: BackgroundRedisDb): Redis {
  let client = backgroundClients.get(db);
  if (!client) {
    client = createBackgroundClient(db);
    backgroundClients.set(db, client);
  }
  return client;
}

export async function connectAll(): Promise<void> {
  const cacheDbs = Object.values(RedisDb).filter(
    (v) => typeof v === "number"
  ) as RedisDb[];
  const bgDbs = Object.values(BackgroundRedisDb).filter(
    (v) => typeof v === "number"
  ) as BackgroundRedisDb[];
  await Promise.all([
    ...cacheDbs.map((db) => getCacheRedis(db).connect()),
    ...bgDbs.map((db) => getBackgroundRedis(db).connect()),
  ]);
}

export async function disconnectAll(): Promise<void> {
  const all = [
    ...Array.from(cacheClients.entries()).map(([, client]) => client.quit()),
    ...Array.from(backgroundClients.entries()).map(([, client]) =>
      client.quit()
    ),
  ];
  cacheClients.clear();
  backgroundClients.clear();
  await Promise.all(all);
}

export function getPubSub(): Redis {
  return getCacheRedis(RedisDb.PubSub);
}

export interface RedisConnectionConfig {
  db?: number;
  host: string;
  password?: string;
  port: number;
}

export function getBackgroundConnectionConfig(
  db: BackgroundRedisDb
): RedisConnectionConfig {
  try {
    const url = new URL(env.redisBackgroundUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      db,
    };
  } catch {
    return { host: "localhost", port: 6379, db };
  }
}
