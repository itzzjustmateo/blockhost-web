import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { env } from "../config/index.ts";
import { setupWebSocket } from "../websocket/index.ts";
import { authRoutes } from "./routes/auth.ts";
import { serverRoutes } from "./routes/servers.ts";

export function createApi() {
  const app = new Elysia()
    .use(
      cors({
        origin: env.isDev ? true : env.betterAuth.url,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      })
    )
    .onError(({ code, error, set }) => {
      if (code === "NOT_FOUND") {
        set.status = 404;
        return { error: "Not found" };
      }

      set.status = set.status ?? 500;
      return {
        error: error instanceof Error ? error.message : "Internal server error",
        code: set.status,
      };
    });

  setupWebSocket(app as unknown as Elysia);

  app.use(authRoutes).use(serverRoutes);

  app.get("/api/health", () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  return app;
}
