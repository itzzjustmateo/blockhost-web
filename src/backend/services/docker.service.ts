import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SERVERS_DIR =
  process.env.BLOCKHOST_SERVERS_DIR ?? "/tmp/blockhost-servers";
const MC_NETWORK = "blockhost-mc";
const MC_IMAGE = "openjdk:21-jre-slim";

function containerName(serverId: string) {
  return `blockhost-mc-${serverId}`;
}

function serverDir(serverId: string) {
  return join(SERVERS_DIR, serverId);
}

export const dockerService = {
  provisionServer(
    serverId: string,
    serverName: string,
    port: number,
    ramMb: number
  ): void {
    const dir = serverDir(serverId);
    const name = containerName(serverId);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Pull the MC image if not already present
    try {
      execSync(`docker image inspect ${MC_IMAGE} > /dev/null 2>&1`, {
        stdio: "ignore",
      });
    } catch {
      console.log(`[Docker] Pulling ${MC_IMAGE}...`);
      execSync(`docker pull ${MC_IMAGE}`, { stdio: "inherit" });
    }

    // Remove existing container if any
    try {
      execSync(`docker rm -f ${name} > /dev/null 2>&1`, { stdio: "ignore" });
    } catch {
      // noop
    }

    const ramXmx = `${Math.floor(ramMb / 2)}M`;
    const ramXms = `${Math.floor(ramMb / 4)}M`;

    // Run the container
    const cmd = [
      "docker run -d",
      `--name ${name}`,
      `--network ${MC_NETWORK}`,
      `-p ${port}:25565/tcp`,
      `-p ${port}:25565/udp`,
      `-v ${dir}:/server:Z`,
      "-w /server",
      `--memory=${ramMb}m`,
      "--restart unless-stopped",
      `--label blockhost-server-id=${serverId}`,
      `--label blockhost-server-name=${serverName}`,
      MC_IMAGE,
      `java -Xmx${ramXmx} -Xms${ramXms} -jar server.jar nogui`,
    ].join(" ");

    console.log(`[Docker] Starting MC server container: ${name}`);
    execSync(cmd, { stdio: "inherit" });

    console.log(`[Docker] ${name} started on port ${port}`);
  },

  stopServer(serverId: string): void {
    const name = containerName(serverId);
    try {
      execSync(`docker stop ${name}`, { stdio: "ignore" });
      console.log(`[Docker] ${name} stopped`);
    } catch (err) {
      console.error(`[Docker] Failed to stop ${name}:`, err);
    }
  },

  startServer(serverId: string): void {
    const name = containerName(serverId);
    try {
      execSync(`docker start ${name}`, { stdio: "ignore" });
      console.log(`[Docker] ${name} started`);
    } catch (err) {
      console.error(`[Docker] Failed to start ${name}:`, err);
    }
  },

  restartServer(serverId: string): void {
    const name = containerName(serverId);
    try {
      execSync(`docker restart ${name}`, { stdio: "ignore" });
      console.log(`[Docker] ${name} restarted`);
    } catch (err) {
      console.error(`[Docker] Failed to restart ${name}:`, err);
    }
  },

  removeServer(serverId: string): void {
    const name = containerName(serverId);
    try {
      execSync(`docker rm -f ${name}`, { stdio: "ignore" });
      console.log(`[Docker] ${name} removed`);
    } catch (err) {
      console.error(`[Docker] Failed to remove ${name}:`, err);
    }
  },

  isServerRunning(serverId: string): boolean {
    const name = containerName(serverId);
    try {
      execSync(`docker inspect -f '{{.State.Running}}' ${name}`, {
        stdio: "pipe",
      });
      return true;
    } catch {
      return false;
    }
  },

  getServerLogs(serverId: string, tail = 50): string {
    const name = containerName(serverId);
    try {
      return execSync(`docker logs --tail ${tail} ${name}`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
    } catch {
      return "";
    }
  },
};
