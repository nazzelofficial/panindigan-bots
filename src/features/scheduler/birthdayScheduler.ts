import cron from "node-cron";
import { BirthdayModel } from "../../database/models/Community.js";
import { GuildModel } from "../../database/models/Guild.js";
import { scopedLogger } from "../../utils/logger.js";
import { baseEmbed } from "../../utils/embeds.js";
import type { PanindiganClient } from "../../structures/Client.js";

const log = scopedLogger("birthday-scheduler");

export function startBirthdayScheduler(client: PanindiganClient): void {
  // Run daily at 8am UTC
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = new Date();
      const month = now.getUTCMonth() + 1;
      const day = now.getUTCDate();

      const birthdays = await BirthdayModel.find({ month, day }).lean();
      if (!birthdays.length) return;

      for (const bday of birthdays) {
        for (const guildId of bday.guildIds ?? []) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;

          const cfg = await GuildModel.findOne({ guildId }).lean();
          const birthdayChannelId = (cfg as any)?.birthdayChannelId;
          const birthdayRoleId = (cfg as any)?.birthdayRoleId;

          if (birthdayChannelId) {
            const ch = guild.channels.cache.get(birthdayChannelId);
            if (ch?.isTextBased()) {
              const user = await client.users.fetch(bday.userId).catch(() => null);
              const msg = (cfg as any)?.birthdayMessage ?? "🎂 Happy Birthday {mention}! Wishing you an amazing day! 🎉";
              const formatted = msg
                .replace("{user}", user?.username ?? `<@${bday.userId}>`)
                .replace("{mention}", `<@${bday.userId}>`)
                .replace("{server}", guild.name);

              const embed = baseEmbed("warning")
                .setTitle("🎂 Happy Birthday!")
                .setDescription(formatted)
                .setThumbnail(user?.displayAvatarURL() ?? null)
                .setTimestamp();

              await (ch as any).send({ embeds: [embed] }).catch((err: any) => {
                log.warn(`Failed to send birthday message in ${guildId}: ${err.message}`);
              });
            }
          }

          if (birthdayRoleId) {
            const member = await guild.members.fetch(bday.userId).catch(() => null);
            if (member) {
              await member.roles.add(birthdayRoleId, "Birthday role").catch(() => {});
              // Schedule role removal after 24 hours
              setTimeout(async () => {
                const m = await guild.members.fetch(bday.userId).catch(() => null);
                await m?.roles.remove(birthdayRoleId, "Birthday role expired").catch(() => {});
              }, 24 * 60 * 60 * 1000);
            }
          }
        }
      }
    } catch (err: any) {
      log.error(`Birthday scheduler error: ${err.message}`);
    }
  });

  log.info("Birthday scheduler started (daily at 08:00 UTC)");
}
