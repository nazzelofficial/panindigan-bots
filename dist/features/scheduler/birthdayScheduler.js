import cron from "node-cron";
import { BirthdayModel } from "@/database/models/Community";
import { GuildModel } from "@/database/models/Guild";
import { scopedLogger } from "@/utils/logger";
import { baseEmbed } from "@/utils/embeds";
const log = scopedLogger("birthday-scheduler");
export function startBirthdayScheduler(client) {
    // Run daily at 8am UTC
    cron.schedule("0 8 * * *", async () => {
        try {
            const now = new Date();
            const month = now.getUTCMonth() + 1;
            const day = now.getUTCDate();
            const birthdays = await BirthdayModel.find({ month, day }).lean();
            if (!birthdays.length)
                return;
            for (const bday of birthdays) {
                for (const guildId of bday.guildIds ?? []) {
                    const guild = client.guilds.cache.get(guildId);
                    if (!guild)
                        continue;
                    const cfg = await GuildModel.findOne({ guildId }).lean();
                    const birthdayChannelId = cfg?.birthdayChannelId;
                    const birthdayRoleId = cfg?.birthdayRoleId;
                    if (birthdayChannelId) {
                        const ch = guild.channels.cache.get(birthdayChannelId);
                        if (ch?.isTextBased()) {
                            const user = await client.users.fetch(bday.userId).catch(() => null);
                            const msg = cfg?.birthdayMessage ?? "🎂 Happy Birthday {mention}! Wishing you an amazing day! 🎉";
                            const formatted = msg
                                .replace("{user}", user?.username ?? `<@${bday.userId}>`)
                                .replace("{mention}", `<@${bday.userId}>`)
                                .replace("{server}", guild.name);
                            const embed = baseEmbed("warning")
                                .setTitle("🎂 Happy Birthday!")
                                .setDescription(formatted)
                                .setThumbnail(user?.displayAvatarURL() ?? null)
                                .setTimestamp();
                            await ch.send({ embeds: [embed] }).catch((err) => {
                                log.warn(`Failed to send birthday message in ${guildId}: ${err.message}`);
                            });
                        }
                    }
                    if (birthdayRoleId) {
                        const member = await guild.members.fetch(bday.userId).catch(() => null);
                        if (member) {
                            await member.roles.add(birthdayRoleId, "Birthday role").catch(() => { });
                            // Schedule role removal after 24 hours
                            setTimeout(async () => {
                                const m = await guild.members.fetch(bday.userId).catch(() => null);
                                await m?.roles.remove(birthdayRoleId, "Birthday role expired").catch(() => { });
                            }, 24 * 60 * 60 * 1000);
                        }
                    }
                }
            }
        }
        catch (err) {
            log.error(`Birthday scheduler error: ${err.message}`);
        }
    });
    log.info("Birthday scheduler started (daily at 08:00 UTC)");
}
//# sourceMappingURL=birthdayScheduler.js.map