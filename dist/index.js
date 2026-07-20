import "dotenv/config";
import { PanindiganClient } from "./structures/Client.js";
import { setClientInstance } from "./structures/clientRegistry.js";
import { connectDatabase } from "./database/connection.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { registerMusicComponentHandlers } from "./handlers/musicComponentHandler.js";
import { validateEnv, requireEnv } from "./config/config.js";
import { scopedLogger, printBanner } from "./utils/logger.js";
import { initLavalink } from "./features/music/musicManager.js";
import { startApiServer } from "./api/server.js";
import { startReminderScheduler } from "./features/scheduler/reminderScheduler.js";
import { startGiveawayScheduler } from "./features/scheduler/giveawayScheduler.js";
import { startPremiumExpiryAudit } from "./features/scheduler/premiumAudit.js";
import { startTempbanScheduler } from "./features/scheduler/tempbanScheduler.js";
import { startBirthdayScheduler } from "./features/scheduler/birthdayScheduler.js";
import { Monitor } from "./structures/Monitor.js";
const VERSION = "0.2.3";
const log = scopedLogger("bootstrap");
/** Run a named startup phase, record its duration, and surface errors cleanly. */
async function phase(name, fn) {
    const t0 = Date.now();
    try {
        await fn();
        const durationMs = Date.now() - t0;
        log.info(`✔ ${name}`, { durationMs });
        return { phase: name, success: true, durationMs };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const durationMs = Date.now() - t0;
        log.error(`✖ ${name} failed`, { error: message, durationMs });
        return { phase: name, success: false, durationMs, detail: message };
    }
}
async function main() {
    const bootStart = Date.now();
    printBanner(VERSION);
    log.info("Starting up…");
    // ── 1. Env validation ────────────────────────────────────────────────────
    const { missing, optionalMissing } = validateEnv();
    if (missing.length) {
        log.error("Missing required environment variables — refusing to start", {
            missing: missing.map((m) => `${m.key} (${m.description})`),
        });
        process.exit(1);
    }
    if (optionalMissing.length) {
        log.warn("Optional env vars not set — related features disabled", {
            optional: optionalMissing.map((m) => m.key),
        });
    }
    // ── 2. Database ──────────────────────────────────────────────────────────
    const dbResult = await phase("Database connect", () => connectDatabase());
    if (!dbResult.success) {
        log.error("Cannot start without a database connection. Check MONGODB_URI.");
        process.exit(1);
    }
    // ── 3. Discord client ────────────────────────────────────────────────────
    const client = new PanindiganClient();
    setClientInstance(client);
    // ── 4. Commands & events ──────────────────────────────────────────────────
    const [cmdResult, evtResult] = await Promise.all([
        phase("Load commands", () => loadCommands(client)),
        phase("Load events", () => loadEvents(client)),
    ]);
    // Register music component handlers
    registerMusicComponentHandlers(client);
    // ── 5. Optional services ──────────────────────────────────────────────────
    await phase("Init Lavalink", async () => initLavalink(client));
    await phase("Start REST API", async () => startApiServer(client));
    await phase("Start schedulers", async () => {
        startReminderScheduler(client);
        startGiveawayScheduler(client);
        startPremiumExpiryAudit();
        startTempbanScheduler(client);
        startBirthdayScheduler(client);
    });
    // ── 6. Discord login ──────────────────────────────────────────────────────
    const loginResult = await phase("Discord login", () => client.login(requireEnv("DISCORD_TOKEN")));
    if (!loginResult.success) {
        log.error("Discord login failed. Check DISCORD_TOKEN.");
        process.exit(1);
    }
    // ── 7. Monitoring ─────────────────────────────────────────────────────────
    client.once("clientReady", () => {
        const monitor = new Monitor(client);
        monitor.start();
        const totalMs = Date.now() - bootStart;
        const mem = process.memoryUsage();
        const heapMB = Math.round(mem.heapUsed / 1_048_576);
        log.info("═══ Startup complete ═══", {
            version: VERSION,
            totalDurationMs: totalMs,
            commands: client.commands.size,
            events: client.events.size,
            guilds: client.guilds.cache.size,
            heapMB,
        });
    });
}
main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.error("Fatal error during bootstrap", { error: message, stack });
    process.exit(1);
});
// ── Process-level safety nets ──────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    log.error("Unhandled promise rejection", { error: message, stack });
});
process.on("uncaughtException", (err) => {
    log.error("Uncaught exception — process will continue", { error: err.message, stack: err.stack });
});
//# sourceMappingURL=index.js.map