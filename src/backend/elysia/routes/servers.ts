import { Elysia, t } from "elysia";
import { serverService } from "../../services/server.service.ts";
import { authGuard } from "../middleware/auth-guard.ts";

const CreateServerBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 64 }),
  ramMb: t.Integer({ minimum: 1024, maximum: 16_384 }),
  storageMb: t.Integer({ minimum: 1024, maximum: 102_400 }),
  minecraftVersion: t.String({ default: "1.20.4" }),
});
const ControlBody = t.Object({
  action: t.Union([
    t.Literal("start"),
    t.Literal("stop"),
    t.Literal("restart"),
    t.Literal("kill"),
  ]),
});
const ModInstallBody = t.Object({ modUrl: t.String() });
const UpdateVersionBody = t.Object({ version: t.String() });

export const serverRoutes = new Elysia({ prefix: "/api/servers" })
  .use(authGuard)

  .get("/", async ({ userId }) => {
    const servers = await serverService.listByUser(userId ?? "");
    return { servers };
  })

  .post(
    "/",
    async ({ userId, body }) => {
      const uid = userId ?? "";
      const serverId = crypto.randomUUID();
      const data = body as {
        name: string;
        ramMb: number;
        storageMb: number;
        minecraftVersion: string;
      };
      const server = await serverService.create({
        userId: uid,
        serverId,
        name: data.name,
        ramMb: data.ramMb,
        storageMb: data.storageMb,
        minecraftVersion: data.minecraftVersion,
      });
      return { server };
    },
    { body: CreateServerBody }
  )

  .get("/online", async () => {
    const online = await serverService.getOnlineServers();
    return { servers: online };
  })

  .get("/:id/status", async ({ params: { id }, set }) => {
    const status = await serverService.getStatus(id);
    if (!status) {
      set.status = 404;
      return { error: "Server not found" };
    }
    return { status };
  })

  .patch("/:id/status", async ({ params: { id }, body }) => {
    const data = body as {
      online?: boolean;
      playerCount?: number;
      tps?: number;
      cpuUsage?: number;
      ramUsage?: number;
    };
    const updated = await serverService.updateStatus(id, data);
    return { status: updated };
  })

  .post(
    "/:id/control",
    async ({ params: { id }, userId, body }) => {
      const data = body as { action: "start" | "stop" | "restart" | "kill" };
      await serverService.control(id, userId ?? "", data.action);
      return { success: true, message: `Server ${data.action} queued` };
    },
    { body: ControlBody }
  )

  .post("/:id/backup", async ({ params: { id }, userId }) => {
    const job = await serverService.backup(id, userId ?? "");
    return { success: true, jobId: job.id };
  })

  .post(
    "/:id/mod",
    async ({ params: { id }, userId, body }) => {
      const data = body as { modUrl: string };
      const job = await serverService.installMod(id, userId ?? "", data.modUrl);
      return { success: true, jobId: job.id };
    },
    { body: ModInstallBody }
  )

  .post(
    "/:id/version",
    async ({ params: { id }, userId, body }) => {
      const data = body as { version: string };
      const job = await serverService.updateVersion(
        id,
        userId ?? "",
        data.version
      );
      return { success: true, jobId: job.id };
    },
    { body: UpdateVersionBody }
  )

  .delete("/:id", async ({ params: { id } }) => {
    await serverService.delete(id);
    return { success: true };
  });
