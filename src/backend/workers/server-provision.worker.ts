import { Worker } from "bullmq";
import { env } from "../config/index.ts";
import { QueueName } from "../queues/index.ts";
import {
  BackgroundRedisDb,
  getBackgroundConnectionConfig,
} from "../redis/index.ts";
import { jobRepository } from "../repositories/job.repository.ts";
import { publishJobEvent } from "../websocket/handlers.ts";

const connection = getBackgroundConnectionConfig(BackgroundRedisDb.BullMq);

export function createProvisionWorker() {
  const worker = new Worker(
    QueueName.ServerProvision,
    async (job) => {
      const { userId, serverId } = job.data;
      const jobId = `provision-${serverId}`;

      try {
        await job.updateProgress(10);
        await jobRepository.upsertJob({
          jobId: job.id ?? jobId,
          queueName: QueueName.ServerProvision,
          userId,
          type: "provision",
          status: "running",
          progress: 10,
          data: job.data,
          maxAttempts: 5,
        });

        await publishJobEvent({
          jobId: job.id ?? jobId,
          serverId,
          type: "provision",
          status: "running",
          progress: 10,
        });

        await job.updateProgress(100);

        await jobRepository.upsertJob({
          jobId: job.id ?? jobId,
          queueName: QueueName.ServerProvision,
          userId,
          type: "provision",
          status: "completed",
          progress: 100,
          data: job.data,
          result: { serverId, provisionedAt: new Date().toISOString() },
          maxAttempts: 5,
          completedAt: new Date(),
        });

        await publishJobEvent({
          jobId: job.id ?? jobId,
          serverId,
          type: "provision",
          status: "completed",
          progress: 100,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        await jobRepository.upsertJob({
          jobId: job.id ?? jobId,
          queueName: QueueName.ServerProvision,
          userId,
          type: "provision",
          status: "failed",
          progress: 0,
          data: job.data,
          error: message,
          maxAttempts: 5,
          failedAt: new Date(),
        });
        throw error;
      }
    },
    {
      connection,
      prefix: env.bullmq.prefix,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[ProvisionWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
