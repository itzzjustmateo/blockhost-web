import { eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { subscription, subscriptionPlan } from "../db/schema/subscriptions.ts";

export type InsertSubscription = typeof subscription.$inferInsert;
export type SelectSubscription = typeof subscription.$inferSelect;
export type InsertPlan = typeof subscriptionPlan.$inferInsert;
export type SelectPlan = typeof subscriptionPlan.$inferSelect;

export const subscriptionRepository = {
  async createPlan(data: InsertPlan) {
    const [row] = await db.insert(subscriptionPlan).values(data).returning();
    return row;
  },

  listPlans() {
    return db
      .select()
      .from(subscriptionPlan)
      .orderBy(subscriptionPlan.priceMonthly);
  },

  async findPlanById(id: string) {
    const [row] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, id));
    return row ?? null;
  },

  async create(data: InsertSubscription) {
    const [row] = await db.insert(subscription).values(data).returning();
    return row;
  },

  async findByUserId(userId: string) {
    const [row] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .leftJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id));
    return row ?? null;
  },

  async update(id: string, data: Partial<InsertSubscription>) {
    const [row] = await db
      .update(subscription)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscription.id, id))
      .returning();
    return row;
  },

  async cancel(id: string) {
    const [row] = await db
      .update(subscription)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: "true",
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, id))
      .returning();
    return row;
  },
};
