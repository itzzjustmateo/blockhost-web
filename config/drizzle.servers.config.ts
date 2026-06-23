import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const databaseUrl = process.env.SERVERS_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("SERVERS_DATABASE_URL is required");
}

export default defineConfig({
  out: "./drizzle/servers",
  schema: [
    "./src/backend/db/schema/servers.ts",
    "./src/backend/db/schema/backups.ts",
    "./src/backend/db/schema/jobs.ts",
  ],
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
});
