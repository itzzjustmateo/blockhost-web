import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const jobHistory = pgTable("job_history", {
  id: uuid().primaryKey().defaultRandom(),
  jobId: text("job_id").notNull().unique(),
  queueName: text("queue_name").notNull(),
  userId: text("user_id").notNull(),
  type: text().notNull(),
  status: text().notNull().default("queued"),
  progress: integer().notNull().default(0),
  data: jsonb(),
  result: jsonb(),
  error: text(),
  attempts: integer().notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
});
