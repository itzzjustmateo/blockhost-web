import type { Elysia } from "elysia";
import { addClient, removeClient, startPubSubBridge } from "./handlers.ts";

export function setupWebSocket(app: Elysia) {
  app.ws("/ws", {
    open(ws) {
      addClient(ws as unknown as WebSocket);
      ws.send(
        JSON.stringify({
          event: "connected",
          data: { message: "WebSocket connected" },
        })
      );
    },
    close(ws) {
      removeClient(ws as unknown as WebSocket);
    },
    message(ws, raw) {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ping") {
          ws.send(
            JSON.stringify({ event: "pong", data: { timestamp: Date.now() } })
          );
        }
        if (msg.subscribe) {
          ws.subscribe(msg.subscribe);
        }
        if (msg.unsubscribe) {
          ws.unsubscribe(msg.unsubscribe);
        }
      } catch {
        ws.send(
          JSON.stringify({
            event: "error",
            data: { message: "Invalid message format" },
          })
        );
      }
    },
  });

  return app;
}

export function startWebSocketBridge() {
  return startPubSubBridge();
}
