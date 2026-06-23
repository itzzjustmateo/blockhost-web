import { getCacheRedis, RedisDb } from "../redis/index.ts";

export interface SessionCacheData {
  email: string;
  expiresAt: string;
  image: string | null;
  name: string;
  userId: string;
}

const SESSION_PREFIX = "session:";
const SESSION_TTL = 900;
const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL = 300;

export async function getSession(
  token: string
): Promise<SessionCacheData | null> {
  const raw = await getCacheRedis(RedisDb.Auth).get(
    `${SESSION_PREFIX}${token}`
  );
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as SessionCacheData;
}

export async function setSessionCache(
  token: string,
  data: SessionCacheData
): Promise<void> {
  await getCacheRedis(RedisDb.Auth).setex(
    `${SESSION_PREFIX}${token}`,
    SESSION_TTL,
    JSON.stringify(data)
  );
}

export async function invalidateSession(token: string): Promise<void> {
  await getCacheRedis(RedisDb.Auth).del(`${SESSION_PREFIX}${token}`);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  const redis = getCacheRedis(RedisDb.Auth);
  const pattern = `${SESSION_PREFIX}*`;
  const keys = await redis.keys(pattern);
  if (!keys.length) {
    return;
  }

  const pipeline = redis.pipeline();
  for (const key of keys) {
    const raw = await redis.get(key);
    if (raw) {
      const data = JSON.parse(raw) as SessionCacheData;
      if (data.userId === userId) {
        pipeline.del(key);
      }
    }
  }
  await pipeline.exec();
}

export async function getUserCache(
  userId: string
): Promise<SessionCacheData | null> {
  const raw = await getCacheRedis(RedisDb.Auth).get(
    `${USER_CACHE_PREFIX}${userId}`
  );
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as SessionCacheData;
}

export async function setUserCache(user: SessionCacheData): Promise<void> {
  await getCacheRedis(RedisDb.Auth).setex(
    `${USER_CACHE_PREFIX}${user.userId}`,
    USER_CACHE_TTL,
    JSON.stringify(user)
  );
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await getCacheRedis(RedisDb.Auth).del(`${USER_CACHE_PREFIX}${userId}`);
}
