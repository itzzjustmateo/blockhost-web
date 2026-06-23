import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "../../../db/auth-schema.ts";

export const subscriptionPlan = pgTable("subscription_plan", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  description: text(),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly"),
  maxServers: integer("max_servers").notNull().default(1),
  maxRamMb: integer("max_ram_mb").notNull().default(1024),
  maxStorageMb: integer("max_storage_mb").notNull().default(10_240),
  features: text().array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscription = pgTable("subscription", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id),
  status: text().notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: text("cancel_at_period_end").default("false"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
