import { eq } from "drizzle-orm";
import { backup } from "../db/schema/backups.ts";
import { serversDb } from "../db/servers-db.ts";

export type InsertBackup = typeof backup.$inferInsert;
export type SelectBackup = typeof backup.$inferSelect;

export const backupRepository = {
  async create(data: InsertBackup) {
    const [row] = await serversDb.insert(backup).values(data).returning();
    return row;
  },

  async findById(id: string) {
    const [row] = await serversDb
      .select()
      .from(backup)
      .where(eq(backup.id, id));
    return row ?? null;
  },

  findByServerId(serverId: string) {
    return serversDb
      .select()
      .from(backup)
      .where(eq(backup.serverId, serverId))
      .orderBy(backup.createdAt);
  },

  findByUserId(userId: string) {
    return serversDb
      .select()
      .from(backup)
      .where(eq(backup.userId, userId))
      .orderBy(backup.createdAt);
  },

  async update(id: string, data: Partial<InsertBackup>) {
    const [row] = await serversDb
      .update(backup)
      .set(data)
      .where(eq(backup.id, id))
      .returning();
    return row;
  },

  async delete(id: string) {
    await serversDb.delete(backup).where(eq(backup.id, id));
  },
};
