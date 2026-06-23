import { serverControlQueue } from "./index.ts";

export type ServerAction = "start" | "stop" | "restart" | "kill";

export interface ControlJobData {
  action: ServerAction;
  reason?: string;
  serverId: string;
  userId: string;
}

export interface ControlJobResult {
  action: ServerAction;
  executedAt: string;
  serverId: string;
  success: boolean;
}

export async function queueServerControl(data: ControlJobData) {
  const job = await serverControlQueue.add(data.action, data, {
    attempts: 3,
  });
  return job;
}
