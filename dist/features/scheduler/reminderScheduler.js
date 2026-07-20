import cron from "node-cron";
import { UserModel } from "../../database/models/User.js";
import { baseEmbed } from "../../utils/embeds.js";
import { scopedLogger } from "../../utils/logger.js";
const log = scopedLogger("scheduler:reminders");
/** Sweeps due reminders every 30 seconds and delivers them to the origin channel. */
export function startReminderScheduler(client) {
    cron.schedule("*/30 * * * * *", async () => {
        try {
            const now = new Date();
            const users = await UserModel.find({ "reminders.remindAt": { $lte: now } });
            for (const user of users) {
                const due = user.reminders.filter((r) => r.remindAt <= now);
                for (const reminder of due) {
                    const channel = client.channels.cache.get(reminder.channelId);
                    if (channel?.isTextBased()) {
                        await channel
                            .send({ content: `<@${user.userId}>`, embeds: [baseEmbed("info").setTitle("⏰ Reminder").setDescription(reminder.text)] })
                            .catch(() => { });
                    }
                }
                user.reminders = user.reminders.filter((r) => r.remindAt > now);
                await user.save();
            }
        }
        catch (err) {
            log.error("Reminder sweep failed", { error: err.message });
        }
    });
}
//# sourceMappingURL=reminderScheduler.js.map