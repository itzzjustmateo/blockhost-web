import { env, requireEnv } from "./config/index.ts";
import { createApi } from "./elysia/index.ts";
import { connectAll, disconnectAll } from "./redis/index.ts";
import { startWebSocketBridge } from "./websocket/index.ts";
import { startWorkers, stopWorkers } from "./workers/index.ts";

async function main() {
  requireEnv();
  console.log(
    `[Backend] Starting BlockHost backend on ${env.host}:${env.port}`
  );

  await connectAll();
  console.log("[Backend] Redis connections established");

  await startWebSocketBridge();
  console.log("[Backend] Redis pub/sub bridge active");

  startWorkers();
  console.log("[Backend] BullMQ workers started");

  const app = createApi();
  const server = app.listen({ port: env.port, hostname: env.host });
  console.log(
    `[Backend] ElysiaJS server listening on http://${env.host}:${env.port}`
  );

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Backend] Received ${signal}, shutting down gracefully...`);
    server.stop();
    await stopWorkers();
    await disconnectAll();
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[Backend] Fatal error:", err);
  process.exit(1);
});
