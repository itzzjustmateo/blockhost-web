import { env } from "../config/index.ts";
import { getCacheRedis, RedisDb } from "../redis/index.ts";

export interface ServerStatusData {
  cpuUsage: number;
  lastHeartbeat: number | null;
  maxPlayers: number;
  motd: string;
  online: boolean;
  playerCount: number;
  ramMax: number;
  ramUsage: number;
  serverId: string;
  tps: number;
  version: string;
}

export interface ServerMetricsData {
  avgPing: number;
  chunkLoads: number;
  entityCount: number;
  playerJoinRate: number;
  uptimeSeconds: number;
}

const STATUS_KEY_PREFIX = "server:";
const METRICS_KEY_SUFFIX = ":status";
const METRICS_SUFFIX = ":metrics";
const TTL = env.serverStatusTtl;

export async function getServerStatus(
  serverId: string
): Promise<ServerStatusData | null> {
  const raw = await getCacheRedis(RedisDb.ServerState).get(
    `${STATUS_KEY_PREFIX}${serverId}${METRICS_KEY_SUFFIX}`
  );
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as ServerStatusData;
}

export async function setServerStatus(data: ServerStatusData): Promise<void> {
  const key = `${STATUS_KEY_PREFIX}${data.serverId}${METRICS_KEY_SUFFIX}`;
  await getCacheRedis(RedisDb.ServerState).setex(
    key,
    TTL,
    JSON.stringify(data)
  );
}

export async function getServerMetrics(
  serverId: string
): Promise<ServerMetricsData | null> {
  const raw = await getCacheRedis(RedisDb.ServerState).get(
    `${STATUS_KEY_PREFIX}${serverId}${METRICS_SUFFIX}`
  );
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as ServerMetricsData;
}

export async function setServerMetrics(
  serverId: string,
  data: ServerMetricsData
): Promise<void> {
  const key = `${STATUS_KEY_PREFIX}${serverId}${METRICS_SUFFIX}`;
  await getCacheRedis(RedisDb.ServerState).setex(
    key,
    TTL,
    JSON.stringify(data)
  );
}

export async function updateHeartbeat(serverId: string): Promise<void> {
  const status = await getServerStatus(serverId);
  if (status) {
    status.lastHeartbeat = Date.now();
    await setServerStatus(status);
  }
}

export async function getOnlineServers(): Promise<string[]> {
  const pattern = `${STATUS_KEY_PREFIX}*${METRICS_KEY_SUFFIX}`;
  const keys = await getCacheRedis(RedisDb.ServerState).keys(pattern);
  const result: string[] = [];

  for (const key of keys) {
    const raw = await getCacheRedis(RedisDb.ServerState).get(key);
    if (raw) {
      const data = JSON.parse(raw) as ServerStatusData;
      if (data.online) {
        result.push(data.serverId);
      }
    }
  }

  return result;
}

export async function clearServerCache(serverId: string): Promise<void> {
  const redis = getCacheRedis(RedisDb.ServerState);
  await redis.del(
    `${STATUS_KEY_PREFIX}${serverId}${METRICS_KEY_SUFFIX}`,
    `${STATUS_KEY_PREFIX}${serverId}${METRICS_SUFFIX}`
  );
}
