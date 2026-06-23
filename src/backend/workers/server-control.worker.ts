import { Worker } from "bullmq";
import { setServerStatus } from "../cache/server-status.ts";
import { env } from "../config/index.ts";
import { QueueName } from "../queues/index.ts";
import type { ControlJobData } from "../queues/server-control.ts";
import {
  BackgroundRedisDb,
  getBackgroundConnectionConfig,
} from "../redis/index.ts";
import { jobRepository } from "../repositories/job.repository.ts";
import { publishJobEvent } from "../websocket/handlers.ts";

const connection = getBackgroundConnectionConfig(BackgroundRedisDb.BullMq);

async function executeControl(data: ControlJobData) {
  const { serverId, action, userId } = data;
  const jobId = `control-${serverId}-${action}-${Date.now()}`;

  await jobRepository.upsertJob({
    jobId,
    queueName: QueueName.ServerControl,
    userId,
    type: action,
    status: "running",
    progress: 0,
    data,
    maxAttempts: 3,
  });

  await publishJobEvent({
    jobId,
    serverId,
    type: action,
    status: "running",
    progress: 0,
  });

  switch (action) {
    case "start":
    case "restart": {
      await setServerStatus({
        serverId,
        online: true,
        playerCount: 0,
        maxPlayers: 20,
        tps: 20,
        cpuUsage: 5,
        ramUsage: 512,
        ramMax: 4096,
        version: "1.20.4",
        motd: "Loading...",
        lastHeartbeat: Date.now(),
      });
      break;
    }
    case "stop":
    case "kill": {
      await setServerStatus({
        serverId,
        online: false,
        playerCount: 0,
        maxPlayers: 20,
        tps: 0,
        cpuUsage: 0,
        ramUsage: 0,
        ramMax: 4096,
        version: "1.20.4",
        motd: "Server Offline",
        lastHeartbeat: null,
      });
      break;
    }
    default: {
      break;
    }
  }

  await jobRepository.upsertJob({
    jobId,
    queueName: QueueName.ServerControl,
    userId,
    type: action,
    status: "completed",
    progress: 100,
    data,
    result: {
      serverId,
      action,
      success: true,
      executedAt: new Date().toISOString(),
    },
    maxAttempts: 3,
    completedAt: new Date(),
  });

  await publishJobEvent({
    jobId,
    serverId,
    type: action,
    status: "completed",
    progress: 100,
  });
}

export function createControlWorker() {
  const worker = new Worker(
    QueueName.ServerControl,
    async (job) => {
      await job.updateProgress(50);
      await executeControl(job.data as ControlJobData);
      await job.updateProgress(100);
    },
    {
      connection,
      prefix: env.bullmq.prefix,
      concurrency: 10,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[ControlWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
