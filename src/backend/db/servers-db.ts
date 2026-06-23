import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/index.ts";
import { backup } from "./schema/backups.ts";
import { jobHistory } from "./schema/jobs.ts";
import { serverStatus } from "./schema/servers.ts";

const url = env.serversDatabaseUrl;
if (!url) {
  throw new Error("SERVERS_DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString: url });

const schema = { serverStatus, backup, jobHistory };

export const serversDb = drizzle(pool, { schema });
export type ServersDbSchema = typeof schema;
