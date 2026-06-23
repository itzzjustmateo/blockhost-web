import {
  clearServerCache,
  getOnlineServers,
  getServerMetrics,
  getServerStatus,
  type ServerStatusData,
  setServerMetrics,
  setServerStatus,
} from "../cache/server-status.ts";
import {
  queueServerControl,
  type ServerAction,
} from "../queues/server-control.ts";
import { queueMaintenance } from "../queues/server-maintenance.ts";
import { queueServerProvision } from "../queues/server-provision.ts";
import { serverRepository } from "../repositories/server.repository.ts";
import { publishServerEvent } from "../websocket/handlers.ts";

const PORT_MIN = 25_565;
const PORT_MAX = 25_664;

export const serverService = {
  async allocatePort(preferred?: number): Promise<number> {
    const used = new Set(await serverRepository.getUsedPorts());
    if (
      preferred !== undefined &&
      !used.has(preferred) &&
      preferred >= PORT_MIN &&
      preferred <= PORT_MAX
    ) {
      return preferred;
    }
    for (let p = PORT_MIN; p <= PORT_MAX; p++) {
      if (!used.has(p)) {
        return p;
      }
    }
    throw new Error("No available ports");
  },

  async create(data: {
    userId: string;
    serverId: string;
    name: string;
    domain?: string | null;
    software?: string;
    ramMb: number;
    storageMb: number;
    minecraftVersion: string;
    port: number;
  }) {
    const record = await serverRepository.create({
      serverId: data.serverId,
      userId: data.userId,
      name: data.name,
      domain: data.domain,
      software: data.software,
      port: data.port,
      online: false,
      maxPlayers: 20,
      ramMax: data.ramMb,
      version: data.minecraftVersion,
    });

    await queueServerProvision({
      userId: data.userId,
      serverId: data.serverId,
      serverName: data.name,
      ramMb: data.ramMb,
      storageMb: data.storageMb,
      minecraftVersion: data.minecraftVersion,
    });

    return record;
  },

  async getStatus(serverId: string) {
    const cached = await getServerStatus(serverId);
    if (cached) {
      return cached;
    }

    const record = await serverRepository.findByServerId(serverId);
    if (!record) {
      return null;
    }

    const data: ServerStatusData = {
      serverId: record.serverId,
      online: record.online,
      playerCount: record.playerCount,
      maxPlayers: record.maxPlayers,
      tps: record.tps ?? 20,
      cpuUsage: record.cpuUsage ?? 0,
      ramUsage: record.ramUsage ?? 0,
      ramMax: record.ramMax ?? 4096,
      version: record.version ?? "1.20.4",
      motd: record.motd ?? "A Minecraft Server",
      lastHeartbeat: record.lastHeartbeat
        ? record.lastHeartbeat.getTime()
        : null,
    };

    await setServerStatus(data);
    return data;
  },

  async updateStatus(serverId: string, data: Partial<ServerStatusData>) {
    const current = await getServerStatus(serverId);
    const merged: ServerStatusData = {
      ...current,
      ...data,
    } as ServerStatusData;
    await setServerStatus(merged);
    await publishServerEvent({ serverId, type: "status-update", data: merged });
    return merged;
  },

  getMetrics(serverId: string) {
    return getServerMetrics(serverId);
  },

  async updateMetrics(
    serverId: string,
    metrics: Parameters<typeof setServerMetrics>[1]
  ) {
    await setServerMetrics(serverId, metrics);
    return metrics;
  },

  async control(serverId: string, userId: string, action: ServerAction) {
    await queueServerControl({ userId, serverId, action });
    await publishServerEvent({
      serverId,
      type: `server-${action}`,
      data: { action },
    });
  },

  backup(serverId: string, userId: string) {
    return queueMaintenance({ userId, serverId, type: "backup" });
  },

  installMod(serverId: string, userId: string, modUrl: string) {
    return queueMaintenance({
      userId,
      serverId,
      type: "install-mod",
      payload: { modUrl },
    });
  },

  updateVersion(serverId: string, userId: string, version: string) {
    return queueMaintenance({
      userId,
      serverId,
      type: "update-version",
      payload: { version },
    });
  },

  listByUser(userId: string) {
    return serverRepository.findByUserId(userId);
  },

  getOnlineServers() {
    return getOnlineServers();
  },

  async delete(serverId: string) {
    await clearServerCache(serverId);
    const record = await serverRepository.findByServerId(serverId);
    if (record) {
      await serverRepository.delete(record.id);
    }
  },
};
