export interface ServerEvent {
  data: unknown;
  serverId: string;
  type: string;
}

export interface JobEvent {
  error?: string;
  jobId: string;
  progress: number;
  serverId: string;
  status: string;
  type: string;
}

export const PUBSUB_CHANNELS = {
  SERVER_EVENTS: "server-events",
  JOB_EVENTS: "job-events",
} as const;

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket) {
  clients.add(ws);
  ws.onclose = () => clients.delete(ws);
}

export function removeClient(ws: WebSocket) {
  clients.delete(ws);
}

export function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  for (const client of clients) {
    try {
      client.send(message);
    } catch {
      clients.delete(client);
    }
  }
}

export async function publishServerEvent(event: ServerEvent) {
  const { getCacheRedis, RedisDb } = await import("../redis/index.ts");
  const redis = getCacheRedis(RedisDb.PubSub);
  await redis.publish(PUBSUB_CHANNELS.SERVER_EVENTS, JSON.stringify(event));
  broadcast("server-event", event);
}

export async function publishJobEvent(event: JobEvent) {
  const { getCacheRedis, RedisDb } = await import("../redis/index.ts");
  const redis = getCacheRedis(RedisDb.PubSub);
  await redis.publish(PUBSUB_CHANNELS.JOB_EVENTS, JSON.stringify(event));
  broadcast("job-event", event);
}

export async function startPubSubBridge() {
  const { getCacheRedis, RedisDb } = await import("../redis/index.ts");
  const pubSubClient = getCacheRedis(RedisDb.PubSub).duplicate();

  await pubSubClient.subscribe(
    PUBSUB_CHANNELS.SERVER_EVENTS,
    PUBSUB_CHANNELS.JOB_EVENTS
  );

  pubSubClient.on("message", (channel, message) => {
    const event =
      channel === PUBSUB_CHANNELS.SERVER_EVENTS ? "server-event" : "job-event";
    broadcast(event, JSON.parse(message));
  });

  return pubSubClient;
}
