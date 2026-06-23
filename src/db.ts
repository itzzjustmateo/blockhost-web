import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon>;

export function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return;
  }
  if (!client) {
    client = neon(url);
  }
  return client;
}
