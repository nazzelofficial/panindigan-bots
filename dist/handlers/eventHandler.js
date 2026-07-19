import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { scopedLogger } from "../utils/logger";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);
const log = scopedLogger("events");
export async function loadEvents(client) {
    const eventsDir = path.join(__dirname, "..", "events");
    if (!fs.existsSync(eventsDir)) {
        log.warn("Events directory not found", { eventsDir });
        return 0;
    }
    const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    let loaded = 0;
    for (const file of files) {
        const full = path.join(eventsDir, file);
        try {
            const mod = _require(full);
            const event = mod.default
                ?? mod.event;
            // ── Event validation ─────────────────────────────────────────────────
            if (!event) {
                log.warn(`Event file has no default export — skipping`, { file });
                continue;
            }
            if (!event.name) {
                log.warn(`Event file is missing "name" field — skipping`, { file });
                continue;
            }
            if (typeof event.execute !== "function") {
                log.warn(`Event "${event.name}" is missing "execute" function — skipping`, { file });
                continue;
            }
            const handler = (...args) => {
                Promise.resolve(event.execute(client, ...args)).catch((err) => {
                    const message = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : undefined;
                    log.error(`Unhandled error in event "${event.name}"`, { error: message, stack });
                });
            };
            if (event.once)
                client.once(event.name, handler);
            else
                client.on(event.name, handler);
            client.events.set(event.name, event);
            loaded++;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            log.error(`Failed to load event file: ${file}`, { error: message });
        }
    }
    log.info(`Loaded ${loaded} events from ${files.length} files`);
    return loaded;
}
//# sourceMappingURL=eventHandler.js.map