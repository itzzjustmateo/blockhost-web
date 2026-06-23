import type { Elysia } from "elysia";

export const rateLimiter = (app: Elysia) =>
  app.onBeforeHandle(({ request }) => {
    const path = new URL(request.url).pathname;
    let tier: string;
    if (path.startsWith("/api/auth")) {
      tier = "auth";
    } else if (path.startsWith("/api/servers")) {
      tier = "server-actions";
    } else {
      tier = "general";
    }
    return { tier };
  });
