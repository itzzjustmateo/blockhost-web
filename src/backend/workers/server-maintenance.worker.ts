import { Worker } from "bullmq";
import { env } from "../config/index.ts";
import { QueueName } from "../queues/index.ts";
import type { MaintenanceJobData } from "../queues/server-maintenance.ts";
import {
  BackgroundRedisDb,
  getBackgroundConnectionConfig,
} from "../redis/index.ts";
import { jobRepository } from "../repositories/job.repository.ts";
import { publishJobEvent } from "../websocket/handlers.ts";

const connection = getBackgroundConnectionConfig(BackgroundRedisDb.BullMq);

async function executeMaintenance(data: MaintenanceJobData) {
  const { serverId, type, userId, payload } = data;
  const jobId = `maint-${serverId}-${type}-${Date.now()}`;

  await jobRepository.upsertJob({
    jobId,
    queueName: QueueName.ServerMaintenance,
    userId,
    type,
    status: "running",
    progress: 0,
    data,
    maxAttempts: 4,
  });

  await publishJobEvent({
    jobId,
    serverId,
    type,
    status: "running",
    progress: 0,
  });

  await jobRepository.upsertJob({
    jobId,
    queueName: QueueName.ServerMaintenance,
    userId,
    type,
    status: "completed",
    progress: 100,
    data,
    result: {
      serverId,
      type,
      success: true,
      details: payload ?? {},
      completedAt: new Date().toISOString(),
    },
    maxAttempts: 4,
    completedAt: new Date(),
  });

  await publishJobEvent({
    jobId,
    serverId,
    type,
    status: "completed",
    progress: 100,
  });
}

export function createMaintenanceWorker() {
  const worker = new Worker(
    QueueName.ServerMaintenance,
    async (job) => {
      await job.updateProgress(50);
      await executeMaintenance(job.data as MaintenanceJobData);
      await job.updateProgress(100);
    },
    {
      connection,
      prefix: env.bullmq.prefix,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[MaintenanceWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
