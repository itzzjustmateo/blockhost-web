import { serverMaintenanceQueue } from "./index.ts";

export type MaintenanceType =
  | "backup"
  | "restore"
  | "install-mod"
  | "update-version"
  | "optimize";

export interface MaintenanceJobData {
  payload?: Record<string, unknown>;
  scheduledAt?: string;
  serverId: string;
  type: MaintenanceType;
  userId: string;
}

export interface MaintenanceJobResult {
  completedAt: string;
  details: Record<string, unknown>;
  serverId: string;
  success: boolean;
  type: MaintenanceType;
}

export async function queueMaintenance(data: MaintenanceJobData) {
  const job = await serverMaintenanceQueue.add(data.type, data, {
    attempts: 4,
    backoff: { type: "fixed", delay: 10_000 },
  });
  return job;
}
