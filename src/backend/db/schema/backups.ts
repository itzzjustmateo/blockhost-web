import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const backup = pgTable("backup", {
  id: uuid().primaryKey().defaultRandom(),
  serverId: text("server_id").notNull(),
  userId: text("user_id").notNull(),
  name: text().notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  status: text().notNull().default("pending"),
  s3Key: text("s3_key"),
  jobId: text("job_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
