import { Elysia, t } from "elysia";
import { authService } from "../../services/auth.service.ts";
import { authGuard, optionalAuth } from "../middleware/auth-guard.ts";

const SESSION_RE = /session=([^;]+)/;

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(optionalAuth)

  .get("/me", async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Not authenticated" };
    }
    const userData = await authService.getUser(userId);
    return { user: userData };
  })

  .post(
    "/logout",
    async ({ request }) => {
      const cookieHeader = request.headers.get("cookie");
      const authorization = request.headers.get("authorization");
      let token: string | null = null;

      if (authorization?.startsWith("Bearer ")) {
        token = authorization.slice(7);
      } else if (cookieHeader) {
        const match = cookieHeader.match(SESSION_RE);
        if (match) {
          token = match[1];
        }
      }

      if (token) {
        await authService.logout(token);
      }

      return { success: true };
    },
    {
      response: t.Object({ success: t.Boolean() }),
    }
  )

  .use(authGuard)
  .get("/session", async ({ userId, userEmail }) => {
    const uid = userId ?? "";
    const userData = await authService.getUser(uid);
    return {
      session: { userId: uid, email: userEmail },
      user: userData,
    };
  });
