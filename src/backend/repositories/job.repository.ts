import { eq } from "drizzle-orm";
import { jobHistory } from "../db/schema/jobs.ts";
import { serversDb } from "../db/servers-db.ts";

export type InsertJob = typeof jobHistory.$inferInsert;
export type SelectJob = typeof jobHistory.$inferSelect;

export const jobRepository = {
  async create(data: InsertJob) {
    const [row] = await serversDb.insert(jobHistory).values(data).returning();
    return row;
  },

  async upsertJob(data: InsertJob) {
    const [existing] = await serversDb
      .select()
      .from(jobHistory)
      .where(eq(jobHistory.jobId, data.jobId));

    if (existing) {
      const [row] = await serversDb
        .update(jobHistory)
        .set(data satisfies Partial<InsertJob>)
        .where(eq(jobHistory.jobId, data.jobId))
        .returning();
      return row;
    }

    const [row] = await serversDb.insert(jobHistory).values(data).returning();
    return row;
  },

  async findByJobId(jobId: string) {
    const [row] = await serversDb
      .select()
      .from(jobHistory)
      .where(eq(jobHistory.jobId, jobId));
    return row ?? null;
  },

  findByUserId(userId: string) {
    return serversDb
      .select()
      .from(jobHistory)
      .where(eq(jobHistory.userId, userId))
      .orderBy(jobHistory.createdAt);
  },

  findByStatus(status: string) {
    return serversDb
      .select()
      .from(jobHistory)
      .where(eq(jobHistory.status, status))
      .orderBy(jobHistory.createdAt);
  },

  listAll() {
    return serversDb.select().from(jobHistory).orderBy(jobHistory.createdAt);
  },
};
