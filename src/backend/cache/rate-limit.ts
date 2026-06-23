import { BackgroundRedisDb, getBackgroundRedis } from "../redis/index.ts";

export type RateLimitType = "ip" | "user";
export type RateLimitScope = "auth" | "server-actions" | "general";

const RATE_LIMIT_PREFIX = "ratelimit:";

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

const limits: Record<RateLimitScope, RateLimitConfig> = {
  auth: { max: 10, windowMs: 60_000 },
  "server-actions": { max: 30, windowMs: 60_000 },
  general: { max: 200, windowMs: 60_000 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
  scope: RateLimitScope
): Promise<RateLimitResult> {
  const redis = getBackgroundRedis(BackgroundRedisDb.RateLimit);
  const config = limits[scope];
  const key = `${RATE_LIMIT_PREFIX}${type}:${identifier}:${scope}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, `${now}:${Math.random()}`);
  multi.zcard(key);
  multi.pexpire(key, config.windowMs);
  multi.zrange(key, 0, -1);

  const results = await multi.exec();

  if (!results) {
    return {
      allowed: true,
      remaining: config.max,
      resetAt: now + config.windowMs,
      retryAfterMs: 0,
    };
  }

  const count = (results[2]?.[1] as number) ?? 0;
  const timestamps = (results[4]?.[1] as string[]) ?? [];
  const oldestTimestamp =
    timestamps.length > 0 ? Number(timestamps[0].split(":")[0]) : now;

  const allowed = count <= config.max;
  const remaining = Math.max(0, config.max - count);
  const resetAt = oldestTimestamp + config.windowMs;
  const retryAfterMs = Math.max(0, resetAt - now);

  return { allowed, remaining, resetAt, retryAfterMs };
}

export async function resetRateLimit(
  type: RateLimitType,
  identifier: string,
  scope: RateLimitScope
): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${type}:${identifier}:${scope}`;
  await getBackgroundRedis(BackgroundRedisDb.RateLimit).del(key);
}
