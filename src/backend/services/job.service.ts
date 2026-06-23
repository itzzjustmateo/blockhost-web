import { getQueueMetrics, type QueueName } from "../queues/index.ts";
import { getCacheRedis, RedisDb } from "../redis/index.ts";
import { jobRepository } from "../repositories/job.repository.ts";

const JOB_PROGRESS_PREFIX = "job:";
const JOB_STATUS_SUFFIX = ":status";
const JOB_PROGRESS_SUFFIX = ":progress";
const JOB_PROGRESS_TTL = 3600;

export const jobService = {
  async getJobProgress(jobId: string) {
    const redis = getCacheRedis(RedisDb.Auth);
    const [status, progress] = await Promise.all([
      redis.get(`${JOB_PROGRESS_PREFIX}${jobId}${JOB_STATUS_SUFFIX}`),
      redis.get(`${JOB_PROGRESS_PREFIX}${jobId}${JOB_PROGRESS_SUFFIX}`),
    ]);

    if (status || progress) {
      return { status: status ?? "unknown", progress: Number(progress) || 0 };
    }

    const persisted = await jobRepository.findByJobId(jobId);
    return persisted
      ? { status: persisted.status, progress: persisted.progress }
      : null;
  },

  async setJobProgress(jobId: string, status: string, progress: number) {
    const redis = getCacheRedis(RedisDb.Auth);
    const pipeline = redis.pipeline();
    pipeline.setex(
      `${JOB_PROGRESS_PREFIX}${jobId}${JOB_STATUS_SUFFIX}`,
      JOB_PROGRESS_TTL,
      status
    );
    pipeline.setex(
      `${JOB_PROGRESS_PREFIX}${jobId}${JOB_PROGRESS_SUFFIX}`,
      JOB_PROGRESS_TTL,
      String(progress)
    );
    await pipeline.exec();
  },

  getQueueMetrics(name: QueueName) {
    return getQueueMetrics(name);
  },

  listJobsByUser(userId: string) {
    return jobRepository.findByUserId(userId);
  },

  listActiveJobs() {
    return jobRepository.findByStatus("running");
  },
};
