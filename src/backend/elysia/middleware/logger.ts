import type { Elysia } from "elysia";
import { env } from "../../config/index.ts";

export const logger = (app: Elysia) =>
  app
    .onRequest(({ request }) => {
      if (!env.isDev) {
        return;
      }
      const url = new URL(request.url);
      console.log(`[${request.method}] ${url.pathname}`);
    })
    .onAfterResponse(({ request, set }) => {
      if (!env.isDev) {
        return;
      }
      const url = new URL(request.url);
      console.log(`[${request.method}] ${url.pathname} → ${set.status}`);
    });
