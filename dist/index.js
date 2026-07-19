import "dotenv/config";
import { PanindiganClient } from "@/structures/Client";
import { setClientInstance } from "@/structures/clientRegistry";
import { connectDatabase } from "@/database/connection";
import { loadCommands } from "@/handlers/commandHandler";
import { loadEvents } from "@/handlers/eventHandler";
import { validateEnv, requireEnv } from "@/config/config";
import { scopedLogger, printBanner } from "@/utils/logger";
import { initLavalink } from "@/features/music/musicManager";
import { startApiServer } from "@/api/server";
import { startReminderScheduler } from "@/features/scheduler/reminderScheduler";
import { startGiveawayScheduler } from "@/features/scheduler/giveawayScheduler";
import { startPremiumExpiryAudit } from "@/features/scheduler/premiumAudit";
import { startTempbanScheduler } from "@/features/scheduler/tempbanScheduler";
import { startBirthdayScheduler } from "@/features/scheduler/birthdayScheduler";
import { Monitor } from "@/structures/Monitor";
const VERSION = "0.1.7";
const log = scopedLogger("bootstrap");
async function phase(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - t0;
    log.info(`\u2714 ${name}`, { durationMs });
    return { phase: name, success: true, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - t0;
    log.error(`\u2716 ${name} failed`, { error: message, durationMs });
    return { phase: name, success: false, durationMs, detail: message };
  }
}
async function main() {
  const bootStart = Date.now();
  printBanner(VERSION);
  log.info("Starting up\u2026");
  const { missing, optionalMissing } = validateEnv();
  if (missing.length) {
    log.error("Missing required environment variables \u2014 refusing to start", {
      missing: missing.map((m) => `${m.key} (${m.description})`)
    });
    process.exit(1);
  }
  if (optionalMissing.length) {
    log.warn("Optional env vars not set \u2014 related features disabled", {
      optional: optionalMissing.map((m) => m.key)
    });
  }
  const dbResult = await phase("Database connect", () => connectDatabase());
  if (!dbResult.success) {
    log.error("Cannot start without a database connection. Check MONGODB_URI.");
    process.exit(1);
  }
  const client = new PanindiganClient();
  setClientInstance(client);
  const [cmdResult, evtResult] = await Promise.all([
    phase("Load commands", () => loadCommands(client)),
    phase("Load events", () => loadEvents(client))
  ]);
  await phase("Init Lavalink", async () => initLavalink(client));
  await phase("Start REST API", async () => startApiServer(client));
  await phase("Start schedulers", async () => {
    startReminderScheduler(client);
    startGiveawayScheduler(client);
    startPremiumExpiryAudit();
    startTempbanScheduler(client);
    startBirthdayScheduler(client);
  });
  const loginResult = await phase("Discord login", () => client.login(requireEnv("DISCORD_TOKEN")));
  if (!loginResult.success) {
    log.error("Discord login failed. Check DISCORD_TOKEN.");
    process.exit(1);
  }
  client.once("clientReady", () => {
    const monitor = new Monitor(client);
    monitor.start();
    const totalMs = Date.now() - bootStart;
    const mem = process.memoryUsage();
    const heapMB = Math.round(mem.heapUsed / 1048576);
    log.info("\u2550\u2550\u2550 Startup complete \u2550\u2550\u2550", {
      version: VERSION,
      totalDurationMs: totalMs,
      commands: client.commands.size,
      events: client.events.size,
      guilds: client.guilds.cache.size,
      heapMB
    });
  });
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : void 0;
  log.error("Fatal error during bootstrap", { error: message, stack });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : void 0;
  log.error("Unhandled promise rejection", { error: message, stack });
});
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception \u2014 process will continue", { error: err.message, stack: err.stack });
});
//# sourceMappingURL=index.js.map