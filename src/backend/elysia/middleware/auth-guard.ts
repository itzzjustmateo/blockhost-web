import { Elysia } from "elysia";
import { checkRateLimit, type RateLimitScope } from "../../cache/rate-limit.ts";
import { authService } from "../../services/auth.service.ts";

const SESSION_RE = /session_token=([^;]+)/;
export const authGuard = new Elysia({ name: "auth-guard" }).derive(
  { as: "scoped" },
  async ({ request, set }) => {
    const authorization = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");

    let token: string | null = null;

    if (authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(SESSION_RE);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      set.status = 401;
      throw new Error("Unauthorized: no session token provided");
    }

    const session = await authService.getSession(token);
    if (!session) {
      set.status = 401;
      throw new Error("Unauthorized: invalid or expired session");
    }

    return { userId: session.userId, userEmail: session.email };
  }
);

export const optionalAuth = new Elysia({ name: "optional-auth" }).derive(
  { as: "scoped" },
  async ({ request }) => {
    const authorization = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");

    let token: string | null = null;

    if (authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(SESSION_RE);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      return { userId: undefined, userEmail: undefined };
    }

    const session = await authService.getSession(token);
    return {
      userId: session?.userId,
      userEmail: session?.email,
    };
  }
);

export function createRateLimiter(scope: RateLimitScope) {
  return new Elysia({ name: `rate-limiter-${scope}` }).derive(
    { as: "scoped" },
    async ({ request, set }) => {
      const ip =
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        "127.0.0.1";

      const result = await checkRateLimit("ip", ip, scope);
      set.headers["x-ratelimit-limit"] = String(result.remaining);
      set.headers["x-ratelimit-remaining"] = String(result.remaining);
      set.headers["x-ratelimit-reset"] = String(result.resetAt);
      set.headers["retry-after"] = String(
        Math.ceil(result.retryAfterMs / 1000)
      );

      if (!result.allowed) {
        set.status = 429;
        throw new Error(
          `Rate limit exceeded. Retry after ${Math.ceil(result.retryAfterMs / 1000)}s`
        );
      }

      return {};
    }
  );
}
