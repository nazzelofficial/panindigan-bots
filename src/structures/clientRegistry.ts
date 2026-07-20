import type { PanindiganClient } from "./Client.js";

/**
 * Small escape hatch so feature modules that don't receive `client` directly
 * (e.g. Mongoose post-save hooks, scheduled cron jobs) can still reach the
 * live Discord client without creating circular imports.
 */
let instance: PanindiganClient | null = null;

export function setClientInstance(client: PanindiganClient): void {
  instance = client;
}

export function getClientInstance(): PanindiganClient | null {
  return instance;
}

/** Legacy compat shim — owner commands that import `clientRegistry` */
export const clientRegistry = {
  get(): PanindiganClient | null {
    return instance;
  },
  set(client: PanindiganClient): void {
    instance = client;
  },
};
