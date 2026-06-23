import { eq } from "drizzle-orm";
import { serverStatus } from "../db/schema/servers.ts";
import { serversDb } from "../db/servers-db.ts";

export type InsertServer = typeof serverStatus.$inferInsert;
export type SelectServer = typeof serverStatus.$inferSelect;

export const serverRepository = {
  async create(data: InsertServer) {
    const [row] = await serversDb.insert(serverStatus).values(data).returning();
    return row;
  },

  async findById(id: string) {
    const [row] = await serversDb
      .select()
      .from(serverStatus)
      .where(eq(serverStatus.id, id));
    return row ?? null;
  },

  async findByServerId(serverId: string) {
    const [row] = await serversDb
      .select()
      .from(serverStatus)
      .where(eq(serverStatus.serverId, serverId));
    return row ?? null;
  },

  findByUserId(userId: string) {
    return serversDb
      .select()
      .from(serverStatus)
      .where(eq(serverStatus.userId, userId));
  },

  async update(id: string, data: Partial<InsertServer>) {
    const [row] = await serversDb
      .update(serverStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serverStatus.id, id))
      .returning();
    return row;
  },

  async updateByServerId(serverId: string, data: Partial<InsertServer>) {
    const [row] = await serversDb
      .update(serverStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serverStatus.serverId, serverId))
      .returning();
    return row;
  },

  async delete(id: string) {
    await serversDb.delete(serverStatus).where(eq(serverStatus.id, id));
  },

  listAll() {
    return serversDb
      .select()
      .from(serverStatus)
      .orderBy(serverStatus.createdAt);
  },

  async countByUserId(userId: string) {
    const rows = await serversDb
      .select({ count: serverStatus.id })
      .from(serverStatus)
      .where(eq(serverStatus.userId, userId));
    return rows.length;
  },
};
