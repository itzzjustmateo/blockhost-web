import { createControlWorker } from "./server-control.worker.ts";
import { createMaintenanceWorker } from "./server-maintenance.worker.ts";
import { createProvisionWorker } from "./server-provision.worker.ts";

let provisionWorker: ReturnType<typeof createProvisionWorker> | null = null;
let controlWorker: ReturnType<typeof createControlWorker> | null = null;
let maintenanceWorker: ReturnType<typeof createMaintenanceWorker> | null = null;

export function startWorkers() {
  provisionWorker = createProvisionWorker();
  controlWorker = createControlWorker();
  maintenanceWorker = createMaintenanceWorker();

  console.log(
    "[Workers] BullMQ workers started (provision, control, maintenance)"
  );
}

export async function stopWorkers() {
  await Promise.all([
    provisionWorker?.close(),
    controlWorker?.close(),
    maintenanceWorker?.close(),
  ]);
  console.log("[Workers] BullMQ workers stopped");
}
