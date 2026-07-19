import cron from "node-cron";
import { ModCaseModel } from "@/database/models/Moderation";
import { scopedLogger } from "@/utils/logger";
import type { PanindiganClient } from "@/structures/Client";

const log = scopedLogger("tempban-scheduler");

export function startTempbanScheduler(client: PanindiganClient): void {
  // Check every minute for expired tempbans
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expiredBans = await ModCaseModel.find({
        type: "tempban",
        active: true,
        expiresAt: { $lte: now },
      }).lean();

      for (const ban of expiredBans) {
        const guild = client.guilds.cache.get(ban.guildId);
        if (!guild) continue;

        try {
          await guild.bans.remove(ban.userId, "Temporary ban expired");
          await ModCaseModel.findByIdAndUpdate(ban._id, { $set: { active: false } });
          log.info(`Unbanned user ${ban.userId} from guild ${ban.guildId} — tempban expired`);
        } catch (err: any) {
          // User may already be unbanned or bot lacks permission
          if (err?.code !== 10026) {
            log.warn(`Failed to unban ${ban.userId} from ${ban.guildId}: ${err.message}`);
          }
          // Mark as inactive regardless to prevent retry spam
          await ModCaseModel.findByIdAndUpdate(ban._id, { $set: { active: false } }).catch(() => {});
        }
      }
    } catch (err: any) {
      log.error(`Tempban scheduler error: ${err.message}`);
    }
  });

  log.info("Tempban scheduler started (every minute)");
}
