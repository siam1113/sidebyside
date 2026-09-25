import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GatewayConfig, GatewayConfigInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gateways.json");

async function readAll(): Promise<GatewayConfig[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as GatewayConfig[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(gateways: GatewayConfig[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(gateways, null, 2), "utf-8");
}

export async function listGateways(): Promise<GatewayConfig[]> {
  return readAll();
}

export async function getGateway(id: string): Promise<GatewayConfig | null> {
  const gateways = await readAll();
  return gateways.find((g) => g.id === id) ?? null;
}

export async function createGateway(
  input: GatewayConfigInput,
): Promise<GatewayConfig> {
  const gateways = await readAll();
  const now = new Date().toISOString();
  const gateway: GatewayConfig = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  gateways.push(gateway);
  await writeAll(gateways);
  return gateway;
}

export async function updateGateway(
  id: string,
  input: GatewayConfigInput,
): Promise<GatewayConfig | null> {
  const gateways = await readAll();
  const index = gateways.findIndex((g) => g.id === id);
  if (index === -1) return null;
  const updated: GatewayConfig = {
    ...input,
    id,
    createdAt: gateways[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  gateways[index] = updated;
  await writeAll(gateways);
  return updated;
}

export async function deleteGateway(id: string): Promise<boolean> {
  const gateways = await readAll();
  const next = gateways.filter((g) => g.id !== id);
  if (next.length === gateways.length) return false;
  await writeAll(next);
  return true;
}
