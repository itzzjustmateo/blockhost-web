import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { account, session, user, verification } from "./auth-schema.ts";
import { todos } from "./schema.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString: url });

const schema = { user, session, account, verification, todos };

export const db = drizzle(pool, { schema });
export type DbSchema = typeof schema;
