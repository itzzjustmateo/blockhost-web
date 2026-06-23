import { Queue } from "bullmq";
import { env } from "../config/index.ts";
import {
  BackgroundRedisDb,
  getBackgroundConnectionConfig,
} from "../redis/index.ts";

export const QueueName = {
  ServerProvision: "server-provision",
  ServerControl: "server-control",
  ServerMaintenance: "server-maintenance",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

const connection = getBackgroundConnectionConfig(BackgroundRedisDb.BullMq);

export const serverProvisionQueue = new Queue(QueueName.ServerProvision, {
  connection,
  prefix: env.bullmq.prefix,
  defaultJobOptions: {
    attempts: env.bullmq.defaultJobOptions.attempts,
    backoff: env.bullmq.defaultJobOptions.backoff,
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

export const serverControlQueue = new Queue(QueueName.ServerControl, {
  connection,
  prefix: env.bullmq.prefix,
  defaultJobOptions: {
    attempts: env.bullmq.defaultJobOptions.attempts,
    backoff: env.bullmq.defaultJobOptions.backoff,
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

export const serverMaintenanceQueue = new Queue(QueueName.ServerMaintenance, {
  connection,
  prefix: env.bullmq.prefix,
  defaultJobOptions: {
    attempts: env.bullmq.defaultJobOptions.attempts,
    backoff: env.bullmq.defaultJobOptions.backoff,
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

export const queues = {
  [QueueName.ServerProvision]: serverProvisionQueue,
  [QueueName.ServerControl]: serverControlQueue,
  [QueueName.ServerMaintenance]: serverMaintenanceQueue,
};

export async function getQueueMetrics(name: QueueName) {
  const q = queues[name];
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

export async function closeAllQueues() {
  await Promise.all(Object.values(queues).map((q) => q.close()));
}
