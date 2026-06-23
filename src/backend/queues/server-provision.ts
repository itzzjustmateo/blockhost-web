import { serverProvisionQueue } from "./index.ts";

export interface ProvisionJobData {
  minecraftVersion: string;
  modpackUrl?: string;
  ramMb: number;
  serverId: string;
  serverName: string;
  storageMb: number;
  userId: string;
}

export interface ProvisionJobResult {
  ip: string;
  port: number;
  provisionedAt: string;
  serverId: string;
}

export async function queueServerProvision(data: ProvisionJobData) {
  const job = await serverProvisionQueue.add("provision", data, {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
  });
  return job;
}
