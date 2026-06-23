import "#/polyfill";

import { cors } from "@elysiajs/cors";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";
import { Elysia } from "elysia";
import { authGuard } from "#/backend/elysia/middleware/auth-guard.ts";
import { subscriptionRepository } from "#/backend/repositories/subscription.repository.ts";
import { cloudflareService } from "#/backend/services/cloudflare.service.ts";
import { serverService } from "#/backend/services/server.service.ts";
import router from "#/orpc/router";
import { TodoSchema } from "#/orpc/schema";

const elysiaApp = new Elysia({ prefix: "/api" })
  .use(cors({ origin: true, credentials: true }))
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      return;
    }
    set.status = set.status ?? 500;
    return {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  })

  .get("/health", () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))

  .use(authGuard)

  .get("/dashboard/stats", async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const servers = await serverService.listByUser(userId);
    const onlineServers = servers.filter((s) => s.online);
    const sub = await subscriptionRepository.findByUserId(userId);
    const planName = sub?.subscription_plan?.name ?? "Free";
    return {
      totalServers: servers.length,
      onlineServers: onlineServers.length,
      plan: planName,
    };
  })

  .get("/servers", async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const servers = await serverService.listByUser(userId);
    return { servers };
  })

  .post("/servers", async ({ userId, body, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    try {
      const data = body as {
        name: string;
        domain?: string;
        minecraftVersion: string;
        software: string;
      };
      const serverId = crypto.randomUUID();
      const finalDomain =
        data.domain ??
        `${data.name.toLowerCase().replace(/[^a-z0-9-]/g, "")}.siuuuhd.de`;

      const server = await serverService.create({
        userId,
        serverId,
        name: data.name,
        domain: finalDomain,
        software: data.software,
        ramMb: 2048,
        storageMb: 10_240,
        minecraftVersion: data.minecraftVersion,
      });

      // Download jar in the background
      downloadServerJar(serverId, data.software, data.minecraftVersion);

      return {
        server: {
          ...server,
          domain: finalDomain,
          software: data.software,
        },
      };
    } catch (error) {
      set.status = 400;
      return {
        error:
          error instanceof Error ? error.message : "Failed to create server",
      };
    }
  })

  .get("/plans", async () => {
    const plans = await subscriptionRepository.listPlans();
    return { plans };
  })

  .post("/redeem", ({ body }) => {
    const code = (body as { code: string }).code;
    return { success: true, message: `Code "${code}" redeemed (stub)` };
  })

  .post("/servers/cloudflare-dns", async ({ userId, body, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const { apiToken, zoneId, domain } = body as {
      apiToken: string;
      zoneId: string;
      domain: string;
    };

    if (!(apiToken && zoneId && domain)) {
      set.status = 400;
      return { error: "apiToken, zoneId, and domain are required" };
    }

    // Verify the token first
    const valid = await cloudflareService.verifyToken(apiToken);
    if (!valid) {
      set.status = 400;
      return { error: "Invalid Cloudflare API token" };
    }

    // Our server IP
    const ip = "185.234.72.18";

    const result = await cloudflareService.addDnsRecords(
      apiToken,
      zoneId,
      domain,
      ip
    );

    if (!result.success) {
      set.status = 400;
      return { error: result.error ?? "Failed to configure DNS" };
    }

    return { success: true, records: result.records };
  });

const orpcHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "TanStack ORPC Playground",
          version: "1.0.0",
        },
        commonSchemas: {
          Todo: { schema: TodoSchema },
          UndefinedError: { error: "UndefinedError" },
        },
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
      docsConfig: {
        authentication: {
          securitySchemes: {
            bearerAuth: {
              token: "default-token",
            },
          },
        },
      },
    }),
  ],
});

async function downloadServerJar(
  serverId: string,
  software: string,
  version: string
) {
  const dir = `/tmp/blockhost-servers/${serverId}`;
  try {
    const { mkdirSync, writeFileSync, chmodSync } = await import("node:fs");
    const { join } = await import("node:path");
    mkdirSync(dir, { recursive: true });
    const res = await fetch(
      `https://mcutils.com/api/server-jars/${software}/${version}/download`
    );
    if (!res.ok) {
      return;
    }
    const buffer = await res.arrayBuffer();
    writeFileSync(join(dir, "server.jar"), Buffer.from(buffer));
    writeFileSync(join(dir, "eula.txt"), "eula=true\n");
    writeFileSync(
      join(dir, "server.properties"),
      "server-port=25565\nmotd=BlockHost Server\nonline-mode=false\n"
    );
    writeFileSync(
      join(dir, "start.sh"),
      "#!/usr/bin/env bash\njava -Xmx2G -jar server.jar nogui\n"
    );
    chmodSync(join(dir, "start.sh"), 0o755);
    console.log(`[Provision] Server ${serverId} downloaded to ${dir}`);
  } catch (err) {
    console.error(`[Provision] Failed to provision ${serverId}:`, err);
  }
}

async function handle({ request }: { request: Request }) {
  const path = new URL(request.url).pathname;

  // Let Elysia handle its routes first
  if (
    path === "/api/health" ||
    path.startsWith("/api/dashboard") ||
    path.startsWith("/api/servers") ||
    path.startsWith("/api/plans") ||
    path.startsWith("/api/redeem")
  ) {
    const elysiaResponse = await elysiaApp.fetch(request);
    if (elysiaResponse.status !== 404) {
      return elysiaResponse;
    }
  }

  // Fallback: if Elysia didn't match, let ORPC handle it
  const { response } = await orpcHandler.handle(request, {
    prefix: "/api",
    context: {},
  });

  return response ?? new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
