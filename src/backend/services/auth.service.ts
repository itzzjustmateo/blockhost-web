import { eq } from "drizzle-orm";
import { session, user } from "../../db/auth-schema.ts";
import { db } from "../../db/index.ts";
import type { SessionCacheData } from "../cache/auth.ts";
import {
  getSession,
  getUserCache,
  invalidateSession,
  invalidateUserCache,
  setSessionCache,
  setUserCache,
} from "../cache/auth.ts";

export const authService = {
  async getSession(token: string): Promise<SessionCacheData | null> {
    const cached = await getSession(token);
    if (cached) {
      return cached;
    }

    const [row] = await db
      .select({
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .innerJoin(session, eq(session.userId, user.id))
      .where(eq(session.token, token));

    if (!row) {
      return null;
    }

    const data: SessionCacheData = {
      userId: row.userId,
      email: row.email,
      name: row.name,
      image: row.image,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };

    await setSessionCache(token, data);
    return data;
  },

  async getUser(userId: string): Promise<SessionCacheData | null> {
    const cached = await getUserCache(userId);
    if (cached) {
      return cached;
    }

    const [row] = await db
      .select({
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!row) {
      return null;
    }

    const data: SessionCacheData = {
      userId: row.userId,
      email: row.email,
      name: row.name,
      image: row.image,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };

    await setUserCache(data);
    return data;
  },

  async logout(token: string): Promise<void> {
    await invalidateSession(token);
  },

  async invalidateUser(userId: string): Promise<void> {
    await invalidateUserCache(userId);
  },
};
